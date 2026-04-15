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
exports.getOrderStats = exports.deliverOrder = exports.updateOrderStatus = exports.getOrderById = exports.getAllOrders = exports.getMyOrders = exports.createOrder = void 0;
const database_1 = __importStar(require("../config/database"));
const response_1 = require("../utils/response");
const discord_webhook_1 = require("../utils/discord.webhook");
// ============================================================
// RGS STORE — Order Controller v3.1
// Handles order creation, retrieval, status updates, and
// credential delivery. Triggers Discord notifications.
// ============================================================
/**
 * POST /api/v1/orders
 * Create a new order (multi-item support)
 */
const createOrder = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { items, payment_method, notes, total_price: clientTotalPrice } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            (0, response_1.sendResponse)(res, 400, false, 'Keranjang belanja kosong.');
            return;
        }
        // Fetch user info
        const [userRows] = await database_1.default.query('SELECT name, email, whatsapp FROM users WHERE id = ? LIMIT 1', [userId]);
        const user = userRows[0];
        if (!user) {
            (0, response_1.sendResponse)(res, 404, false, 'User tidak ditemukan.');
            return;
        }
        let calculatedTotalPrice = 0;
        const processedItems = [];
        // 1. VALIDASI STOK & HARGA UNTUK SEMUA ITEM
        for (const item of items) {
            const [productRows] = await database_1.default.query('SELECT * FROM products WHERE id = ? AND is_active = 1 LIMIT 1', [item.product_id]);
            const product = productRows[0];
            if (!product) {
                (0, response_1.sendResponse)(res, 404, false, `Produk "${item.name || item.product_id}" tidak ditemukan.`);
                return;
            }
            if (product.stock < item.qty) {
                (0, response_1.sendResponse)(res, 400, false, `Stok "${product.name}" tidak mencukupi (Tersisa ${product.stock}).`);
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
        const orderId = (0, database_1.generateUUID)();
        const orderNumber = (0, database_1.generateOrderNumber)();
        // Summary name for the table (e.g. "Product A (+2 items)")
        const primaryItem = processedItems[0];
        const summaryName = processedItems.length > 1
            ? `${primaryItem.name} dan ${processedItems.length - 1} item lainnya`
            : primaryItem.name;
        // 3. INSERT ORDER
        await database_1.default.query(`INSERT INTO orders (id, order_number, user_id, user_name, user_email, user_whatsapp, product_id, product_name, qty, unit_price, total_price, payment_method, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            orderId,
            orderNumber,
            userId,
            user.name,
            user.email,
            user.whatsapp,
            primaryItem.product_id,
            summaryName,
            items.reduce((acc, cur) => acc + cur.qty, 0),
            primaryItem.unit_price,
            calculatedTotalPrice,
            payment_method,
            'pending',
            JSON.stringify({ items: processedItems, user_notes: notes || null }) // Save full detail in notes JSON
        ]);
        // 4. REDUCE STOCK FOR ALL
        for (const item of items) {
            await database_1.default.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.product_id]);
        }
        // 5. FETCH CREATED ORDER
        const [orderRows] = await database_1.default.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
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
        (0, discord_webhook_1.sendDiscordWebhook)((0, discord_webhook_1.buildOrderEmbed)({
            order_number: orderNumber,
            product_name: summaryName,
            qty: items.length,
            total_price: calculatedTotalPrice,
            payment_method,
            user_name: user.name,
            user_email: user.email
        })).catch(() => { });
        (0, response_1.sendResponse)(res, 201, true, 'Order berhasil dibuat!', {
            order: newOrder,
            whatsapp_url: waUrl
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createOrder = createOrder;
/**
 * GET /api/v1/orders/me
 * Get orders for the current logged-in user
 */
const getMyOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const [orders] = await database_1.default.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        (0, response_1.sendResponse)(res, 200, true, 'Riwayat order berhasil dimuat.', orders);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyOrders = getMyOrders;
/**
 * GET /api/v1/orders
 * Get all orders (admin only)
 */
const getAllOrders = async (_req, res, next) => {
    try {
        const [orders] = await database_1.default.query('SELECT * FROM orders ORDER BY created_at DESC');
        (0, response_1.sendResponse)(res, 200, true, 'Semua order berhasil dimuat.', orders);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllOrders = getAllOrders;
/**
 * GET /api/v1/orders/:id
 * Get single order by ID (admin or order owner)
 */
const getOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;
        let query = 'SELECT * FROM orders WHERE id = ? LIMIT 1';
        const params = [orderId];
        if (userRole !== 'admin') {
            query = 'SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1';
            params.push(userId);
        }
        const [rows] = await database_1.default.query(query, params);
        const order = rows[0];
        if (!order) {
            (0, response_1.sendResponse)(res, 404, false, 'Order tidak ditemukan.');
            return;
        }
        (0, response_1.sendResponse)(res, 200, true, 'Order berhasil dimuat.', order);
    }
    catch (error) {
        next(error);
    }
};
exports.getOrderById = getOrderById;
/**
 * PUT /api/v1/orders/:id/status
 * Update order status (admin only)
 */
const updateOrderStatus = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        const [existingRows] = await database_1.default.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
        const existingOrder = existingRows[0];
        if (!existingOrder) {
            (0, response_1.sendResponse)(res, 404, false, 'Order tidak ditemukan.');
            return;
        }
        // If cancelling/failing, restore stock
        if ((status === 'cancelled' || status === 'failed') && existingOrder.status === 'pending') {
            await database_1.default.query('UPDATE products SET stock = stock + ? WHERE id = ?', [existingOrder.qty, existingOrder.product_id]);
        }
        await database_1.default.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
        const [updatedRows] = await database_1.default.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
        (0, response_1.sendResponse)(res, 200, true, `Status order diperbarui menjadi "${status}".`, updatedRows[0]);
    }
    catch (error) {
        next(error);
    }
};
exports.updateOrderStatus = updateOrderStatus;
/**
 * PUT /api/v1/orders/:id/deliver
 * Set order status to 'shipped' and store credentials (admin only)
 */
const deliverOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { credentials } = req.body;
        if (!credentials || String(credentials).trim() === '') {
            (0, response_1.sendResponse)(res, 400, false, 'Kredensial/link produk wajib diisi.');
            return;
        }
        const [existingRows] = await database_1.default.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
        const order = existingRows[0];
        if (!order) {
            (0, response_1.sendResponse)(res, 404, false, 'Order tidak ditemukan.');
            return;
        }
        await database_1.default.query('UPDATE orders SET status = ?, credentials = ?, shipped_at = NOW() WHERE id = ?', ['shipped', credentials, orderId]);
        const [updatedRows] = await database_1.default.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
        (0, response_1.sendResponse)(res, 200, true, 'Pesanan telah dikirim dan kredensial disimpan.', updatedRows[0]);
    }
    catch (error) {
        next(error);
    }
};
exports.deliverOrder = deliverOrder;
/**
 * GET /api/v1/orders/stats/summary
 * Get order statistics (admin only)
 */
const getOrderStats = async (_req, res, next) => {
    try {
        const [totalRows] = await database_1.default.query('SELECT COUNT(*) as total FROM orders');
        const [pendingRows] = await database_1.default.query('SELECT COUNT(*) as total FROM orders WHERE status = "pending"');
        const [successRows] = await database_1.default.query('SELECT COUNT(*) as total FROM orders WHERE status IN ("success", "shipped")');
        const [revenueRows] = await database_1.default.query('SELECT COALESCE(SUM(total_price), 0) as revenue FROM orders WHERE status IN ("success", "shipped")');
        (0, response_1.sendResponse)(res, 200, true, 'Statistik order berhasil dimuat.', {
            total_orders: totalRows[0].total,
            pending_orders: pendingRows[0].total,
            success_orders: successRows[0].total,
            total_revenue: revenueRows[0].revenue
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrderStats = getOrderStats;
//# sourceMappingURL=order.controller.js.map