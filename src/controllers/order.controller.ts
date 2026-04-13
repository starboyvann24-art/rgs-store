import { Response, NextFunction } from 'express';
import db, { generateUUID, generateOrderNumber } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendResponse } from '../utils/response';

// ============================================================
// RGS STORE — Order Controller
// Handles order creation, retrieval, and status updates
// ============================================================

/**
 * POST /api/v1/orders
 * Create a new order (requires auth)
 */
export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userName = req.user!.name;
    const userEmail = req.user!.email;
    const { product_id, qty, payment_method, notes } = req.body;

    // Fetch user's whatsapp
    const [userRows] = await db.query<any>(
      'SELECT whatsapp FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    const userWhatsapp = userRows[0]?.whatsapp || null;

    // Fetch product
    const [productRows] = await db.query<any>(
      'SELECT * FROM products WHERE id = ? AND is_active = 1 LIMIT 1',
      [product_id]
    );

    const product = productRows[0];
    if (!product) {
      sendResponse(res, 404, false, 'Produk tidak ditemukan atau sudah tidak aktif.');
      return;
    }

    // Check stock
    if (product.stock < qty) {
      sendResponse(res, 400, false, `Stok tidak mencukupi. Tersisa ${product.stock} item.`);
      return;
    }

    // Calculate price
    const unitPrice = product.final_price;
    const totalPrice = unitPrice * qty;

    // Generate IDs
    const orderId = generateUUID();
    const orderNumber = generateOrderNumber();

    // Insert order
    await db.query(
      `INSERT INTO orders (id, order_number, user_id, user_name, user_email, user_whatsapp, product_id, product_name, qty, unit_price, total_price, payment_method, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        orderNumber,
        userId,
        userName,
        userEmail,
        userWhatsapp,
        product_id,
        product.name,
        qty,
        unitPrice,
        totalPrice,
        payment_method,
        'pending',
        notes || null
      ]
    );

    // Reduce stock
    await db.query(
      'UPDATE products SET stock = stock - ? WHERE id = ?',
      [qty, product_id]
    );

    // Fetch the created order
    const [orderRows] = await db.query<any>(
      'SELECT * FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    );
    const newOrder = orderRows[0];

    // Build WhatsApp auto-redirect data
    const waNumber = process.env.WA_ADMIN || '62882016259591';
    const waMessage = [
      `🛒 *ORDER BARU — RGS STORE*`,
      ``,
      `📋 *Detail Pesanan:*`,
      `▸ Order ID: #${orderNumber}`,
      `▸ Produk: ${product.name}`,
      `▸ Jumlah: ${qty}`,
      `▸ Harga Satuan: Rp ${unitPrice.toLocaleString('id-ID')}`,
      `▸ Total: *Rp ${totalPrice.toLocaleString('id-ID')}*`,
      `▸ Pembayaran: ${payment_method}`,
      ``,
      `👤 *Data Pembeli:*`,
      `▸ Nama: ${userName}`,
      `▸ Email: ${userEmail}`,
      ``,
      `Mohon konfirmasi pesanan ini. Terima kasih! 🙏`
    ].join('\n');

    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

    sendResponse(res, 201, true, 'Order berhasil dibuat!', {
      order: newOrder,
      whatsapp_url: waUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/orders/me
 * Get orders for the current logged-in user
 */
export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [orders] = await db.query<any>(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    sendResponse(res, 200, true, 'Riwayat order berhasil dimuat.', orders);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/orders
 * Get all orders (admin only)
 */
export const getAllOrders = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [orders] = await db.query<any>(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );

    sendResponse(res, 200, true, 'Semua order berhasil dimuat.', orders);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/orders/:id
 * Get single order by ID (admin or order owner)
 */
export const getOrderById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderId = req.params.id;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let query = 'SELECT * FROM orders WHERE id = ? LIMIT 1';
    const params: any[] = [orderId];

    // Non-admin can only see their own orders
    if (userRole !== 'admin') {
      query = 'SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1';
      params.push(userId);
    }

    const [rows] = await db.query<any>(query, params);
    const order = rows[0];

    if (!order) {
      sendResponse(res, 404, false, 'Order tidak ditemukan.');
      return;
    }

    sendResponse(res, 200, true, 'Order berhasil dimuat.', order);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/orders/:id/status
 * Update order status (admin only)
 */
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    // Check if order exists
    const [existingRows] = await db.query<any>(
      'SELECT * FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    );

    const existingOrder = existingRows[0];
    if (!existingOrder) {
      sendResponse(res, 404, false, 'Order tidak ditemukan.');
      return;
    }

    // If cancelling/failing, restore stock
    if ((status === 'cancelled' || status === 'failed') && existingOrder.status === 'pending') {
      await db.query(
        'UPDATE products SET stock = stock + ? WHERE id = ?',
        [existingOrder.qty, existingOrder.product_id]
      );
    }

    // Update status
    await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    // Fetch updated order
    const [updatedRows] = await db.query<any>(
      'SELECT * FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    );
    const updatedOrder = updatedRows[0];

    sendResponse(res, 200, true, `Status order diperbarui menjadi "${status}".`, updatedOrder);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/orders/stats/summary
 * Get order statistics (admin only)
 */
export const getOrderStats = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalRows] = await db.query<any>('SELECT COUNT(*) as total FROM orders');
    const [pendingRows] = await db.query<any>('SELECT COUNT(*) as total FROM orders WHERE status = "pending"');
    const [successRows] = await db.query<any>('SELECT COUNT(*) as total FROM orders WHERE status = "success"');
    const [revenueRows] = await db.query<any>('SELECT COALESCE(SUM(total_price), 0) as revenue FROM orders WHERE status = "success"');

    sendResponse(res, 200, true, 'Statistik order berhasil dimuat.', {
      total_orders: totalRows[0].total,
      pending_orders: pendingRows[0].total,
      success_orders: successRows[0].total,
      total_revenue: revenueRows[0].revenue
    });
  } catch (error) {
    next(error);
  }
};
