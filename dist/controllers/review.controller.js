"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductReviews = exports.createReview = void 0;
const database_1 = __importStar(require("../config/database"));
const response_1 = require("../utils/response");
// ============================================================
// RGS STORE — Review Controller
// Users with completed orders can rate & review products
// ============================================================
/**
 * POST /api/v1/reviews
 * Create a review for a completed order (user)
 */
const createReview = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userName = req.user.name;
        const { order_id, rating, comment } = req.body;
        // Validate rating
        const ratingNum = parseInt(rating, 10);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            (0, response_1.sendResponse)(res, 400, false, 'Rating harus antara 1 sampai 5.');
            return;
        }
        // Verify the order belongs to user and is completed
        const [orderRows] = await database_1.default.query(`SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1`, [order_id, userId]);
        const order = orderRows[0];
        if (!order) {
            (0, response_1.sendResponse)(res, 404, false, 'Order tidak ditemukan.');
            return;
        }
        if (!['success', 'shipped'].includes(order.status)) {
            (0, response_1.sendResponse)(res, 400, false, 'Review hanya bisa diberikan untuk pesanan yang sudah selesai atau dikirim.');
            return;
        }
        // Check if already reviewed
        const [existingReview] = await database_1.default.query('SELECT id FROM reviews WHERE order_id = ? LIMIT 1', [order_id]);
        if (existingReview[0]) {
            (0, response_1.sendResponse)(res, 409, false, 'Anda sudah memberikan ulasan untuk pesanan ini.');
            return;
        }
        const reviewId = (0, database_1.generateUUID)();
        await database_1.default.query(`INSERT INTO reviews (id, product_id, user_id, order_id, rating, comment, user_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [reviewId, order.product_id, userId, order_id, ratingNum, comment || null, userName]);
        const [rows] = await database_1.default.query('SELECT * FROM reviews WHERE id = ? LIMIT 1', [reviewId]);
        (0, response_1.sendResponse)(res, 201, true, 'Ulasan berhasil dikirim. Terima kasih!', rows[0]);
    }
    catch (error) {
        next(error);
    }
};
exports.createReview = createReview;
/**
 * GET /api/v1/reviews/product/:productId
 * Get all reviews for a specific product (public)
 */
const getProductReviews = async (req, res, next) => {
    try {
        const productId = req.params.productId;
        const [reviews] = await database_1.default.query(`SELECT r.*, 
        ROUND(AVG(r.rating) OVER (PARTITION BY r.product_id), 1) as avg_rating
       FROM reviews r
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`, [productId]);
        const [avgRows] = await database_1.default.query('SELECT ROUND(AVG(rating), 1) as avg_rating, COUNT(*) as total FROM reviews WHERE product_id = ?', [productId]);
        (0, response_1.sendResponse)(res, 200, true, 'Ulasan berhasil dimuat.', {
            reviews,
            summary: {
                avg_rating: avgRows[0].avg_rating || 0,
                total: avgRows[0].total || 0
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProductReviews = getProductReviews;
//# sourceMappingURL=review.controller.js.map