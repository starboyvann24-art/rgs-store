import { Response, NextFunction } from 'express';
import db, { generateUUID, generateOrderNumber } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendResponse } from '../utils/response';
import { sendDiscordWebhook, buildOrderEmbed } from '../utils/discord.webhook';

// ============================================================
// RGS STORE — Order Controller v3.1
// Handles order creation, retrieval, status updates, and
// credential delivery. Triggers Discord notifications.
// ============================================================

/**
 * POST /api/v1/orders
 * Create a new order (multi-item support)
 */
export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { items, payment_method, notes, total_price: clientTotalPrice } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      sendResponse(res, 400, false, 'Keranjang belanja kosong.');
      return;
    }

    // Fetch user info
    const [userRows] = await db.query<any>('SELECT name, email, whatsapp FROM users WHERE id = ? LIMIT 1', [userId]);
    const user = userRows[0];
    if (!user) {
      sendResponse(res, 404, false, 'User tidak ditemukan.');
      return;
    }

    let calculatedTotalPrice = 0;
    const processedItems: any[] = [];

    // 1. VALIDASI STOK & HARGA UNTUK SEMUA ITEM
    for (const item of items) {
      const [productRows] = await db.query<any>(
        'SELECT * FROM products WHERE id = ? AND is_active = 1 LIMIT 1',
        [item.product_id]
      );
      const product = productRows[0];

      if (!product) {
        sendResponse(res, 404, false, `Produk "${item.name || item.product_id}" tidak ditemukan.`);
        return;
      }

      if (product.stock < item.qty) {
        sendResponse(res, 400, false, `Stok "${product.name}" tidak mencukupi (Tersisa ${product.stock}).`);
        return;
      }

      const itemTotal = product.final_price * item.qty;
      calculatedTotalPrice += itemTotal;
      
      processedItems.push({
        ...item,
        name: product.name,
        unit_price: product.final_price,
        total: itemTotal
      });
    }

    // 2. GENERATE ID & SUMMARY
    const orderId = generateUUID();
    const orderNumber = generateOrderNumber();
    
    // Summary name for the table (e.g. "Product A (+2 items)")
    const primaryItem = processedItems[0];
    const summaryName = processedItems.length > 1 
      ? `${primaryItem.name} dan ${processedItems.length - 1} item lainnya`
      : primaryItem.name;

    // 3. INSERT ORDER
    await db.query(
      `INSERT INTO orders (id, order_number, user_id, user_name, user_email, user_whatsapp, product_id, product_name, qty, unit_price, total_price, payment_method, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        orderNumber,
        userId,
        user.name,
        user.email,
        user.whatsapp,
        primaryItem.product_id,
        summaryName,
        items.reduce((acc: number, cur: any) => acc + cur.qty, 0),
        primaryItem.unit_price,
        calculatedTotalPrice,
        payment_method,
        'pending',
        JSON.stringify({ items: processedItems, user_notes: notes || null }) // Save full detail in notes JSON
      ]
    );

    // 4. REDUCE STOCK FOR ALL
    for (const item of items) {
      await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.product_id]);
    }

    // 5. FETCH CREATED ORDER
    const [orderRows] = await db.query<any>('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
    const newOrder = orderRows[0];

    // 6. WHATSAPP NOTIFICATION DATA
    const waNumber = process.env.WA_ADMIN || '62882016259591';
    const waMessage = [
      `🛒 *ORDER BARU — RGS STORE*`,
      ``,
      `📋 *Detail Pesanan:*`,
      `▸ Invoice: #${orderNumber}`,
      ...processedItems.map(it => `▸ ${it.name} x${it.qty} (Rp ${it.total.toLocaleString('id-ID')})`),
      ``,
      `💰 *Total Bayar: Rp ${calculatedTotalPrice.toLocaleString('id-ID')}*`,
      `💳 *Metode: ${payment_method}*`,
      ``,
      `👤 *Pembeli: ${user.name}*`,
      `📧 *Email: ${user.email}*`,
      ``,
      `Mohon segera diproses. Terima kasih! 🙏`
    ].join('\n');

    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

    // Discord notification
    sendDiscordWebhook(buildOrderEmbed({
      order_number: orderNumber,
      product_name: summaryName,
      qty: items.length,
      total_price: calculatedTotalPrice,
      payment_method,
      user_name: user.name,
      user_email: user.email
    })).catch(() => {});

    sendResponse(res, 201, true, 'Order berhasil dibuat!', {
      order: newOrder,
      whatsapp_url: waUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/orders/confirm
 * Submit payment proof for an order
 */
export const confirmOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { order_id } = req.body;
    const file = req.file;

    if (!order_id) {
      sendResponse(res, 400, false, 'Order ID wajib diisi.');
      return;
    }

    if (!file) {
      sendResponse(res, 400, false, 'Bukti pembayaran wajib diunggah.');
      return;
    }

    // Check if order exists and belongs to user
    const [rows] = await db.query<any>(
      'SELECT id, status FROM orders WHERE id = ? AND user_id = ? LIMIT 1',
      [order_id, userId]
    );

    const order = rows[0];
    if (!order) {
      sendResponse(res, 404, false, 'Pesanan tidak ditemukan.');
      return;
    }

    if (order.status !== 'pending') {
      sendResponse(res, 400, false, 'Pesanan ini sudah dikonfirmasi atau diproses.');
      return;
    }

    // Save absolute or relative path? store uses relative to public usually
    const proofUrl = `/proofs/${file.filename}`;

    await db.query(
      'UPDATE orders SET payment_proof = ?, status = ? WHERE id = ?',
      [proofUrl, 'waiting_confirmation', order_id]
    );

    sendResponse(res, 200, true, 'Bukti pembayaran berhasil diunggah. Mohon tunggu verifikasi admin.');
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

    await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    const [updatedRows] = await db.query<any>(
      'SELECT * FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    );

    sendResponse(res, 200, true, `Status order diperbarui menjadi "${status}".`, updatedRows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/orders/:id/deliver
 * Set order status to 'shipped' and store credentials (admin only)
 */
export const deliverOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderId = req.params.id;
    const { credentials } = req.body;

    if (!credentials || String(credentials).trim() === '') {
      sendResponse(res, 400, false, 'Kredensial/link produk wajib diisi.');
      return;
    }

    const [existingRows] = await db.query<any>(
      'SELECT * FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    );

    const order = existingRows[0];
    if (!order) {
      sendResponse(res, 404, false, 'Order tidak ditemukan.');
      return;
    }

    await db.query(
      'UPDATE orders SET status = ?, credentials = ?, shipped_at = NOW() WHERE id = ?',
      ['shipped', credentials, orderId]
    );

    const [updatedRows] = await db.query<any>(
      'SELECT * FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    );

    sendResponse(res, 200, true, 'Pesanan telah dikirim dan kredensial disimpan.', updatedRows[0]);
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
    const [successRows] = await db.query<any>('SELECT COUNT(*) as total FROM orders WHERE status IN ("success", "shipped")');
    const [revenueRows] = await db.query<any>('SELECT COALESCE(SUM(total_price), 0) as revenue FROM orders WHERE status IN ("success", "shipped")');

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

/**
 * GET /api/v1/orders/admin/waiting
 * Get all orders waiting for payment confirmation (admin only)
 */
export const getWaitingOrders = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [orders] = await db.query<any>(
      'SELECT * FROM orders WHERE status = "waiting_confirmation" ORDER BY created_at ASC'
    );

    sendResponse(res, 200, true, 'Pesanan menunggu verifikasi berhasil dimuat.', orders);
  } catch (error) {
    next(error);
  }
};
