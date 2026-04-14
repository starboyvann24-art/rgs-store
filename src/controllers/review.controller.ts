import { Response, NextFunction } from 'express';
import db, { generateUUID } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendResponse } from '../utils/response';

// ============================================================
// RGS STORE — Review Controller
// Users with completed orders can rate & review products
// ============================================================

/**
 * POST /api/v1/reviews
 * Create a review for a completed order (user)
 */
export const createReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userName = req.user!.name;
    const { order_id, rating, comment } = req.body;

    // Validate rating
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      sendResponse(res, 400, false, 'Rating harus antara 1 sampai 5.');
      return;
    }

    // Verify the order belongs to user and is completed
    const [orderRows] = await db.query<any>(
      `SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1`,
      [order_id, userId]
    );

    const order = orderRows[0];
    if (!order) {
      sendResponse(res, 404, false, 'Order tidak ditemukan.');
      return;
    }

    if (!['success', 'shipped'].includes(order.status)) {
      sendResponse(res, 400, false, 'Review hanya bisa diberikan untuk pesanan yang sudah selesai atau dikirim.');
      return;
    }

    // Check if already reviewed
    const [existingReview] = await db.query<any>(
      'SELECT id FROM reviews WHERE order_id = ? LIMIT 1',
      [order_id]
    );

    if (existingReview[0]) {
      sendResponse(res, 409, false, 'Anda sudah memberikan ulasan untuk pesanan ini.');
      return;
    }

    const reviewId = generateUUID();

    await db.query(
      `INSERT INTO reviews (id, product_id, user_id, order_id, rating, comment, user_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reviewId, order.product_id, userId, order_id, ratingNum, comment || null, userName]
    );

    const [rows] = await db.query<any>(
      'SELECT * FROM reviews WHERE id = ? LIMIT 1',
      [reviewId]
    );

    sendResponse(res, 201, true, 'Ulasan berhasil dikirim. Terima kasih!', rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reviews/product/:productId
 * Get all reviews for a specific product (public)
 */
export const getProductReviews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = req.params.productId;

    const [reviews] = await db.query<any>(
      `SELECT r.*, 
        ROUND(AVG(r.rating) OVER (PARTITION BY r.product_id), 1) as avg_rating
       FROM reviews r
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [productId]
    );

    const [avgRows] = await db.query<any>(
      'SELECT ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as total FROM reviews WHERE product_id = ?',
      [productId]
    );

    sendResponse(res, 200, true, 'Ulasan berhasil dimuat.', {
      reviews,
      summary: {
        avg_rating: avgRows[0].avg_rating || 0,
        total: avgRows[0].total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
