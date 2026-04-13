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
exports.getOrderStats = exports.updateOrderStatus = exports.getOrderById = exports.getAllOrders = exports.getMyOrders = exports.createOrder = void 0;
const database_1 = __importStar(require("../config/database"));
const response_1 = require("../utils/response");
// ============================================================
// RGS STORE — Order Controller
// Handles order creation, retrieval, and status updates
// ============================================================
/**
 * POST /api/v1/orders
 * Create a new order (requires auth)
 */
const createOrder = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userName = req.user.name;
        const userEmail = req.user.email;
        const { product_id, qty, payment_method, notes } = req.body;
        // Fetch user's whatsapp
        const [userRows] = await database_1.default.query('SELECT whatsapp FROM users WHERE id = ? LIMIT 1', [userId]);
        const userWhatsapp = userRows[0]?.whatsapp || null;
        // Fetch product
        const [productRows] = await database_1.default.query('SELECT * FROM products WHERE id = ? AND is_active = 1 LIMIT 1', [product_id]);
        const product = productRows[0];
        if (!product) {
            (0, response_1.sendResponse)(res, 404, false, 'Produk tidak ditemukan atau sudah tidak aktif.');
            return;
        }
        // Check stock
        if (product.stock < qty) {
            (0, response_1.sendResponse)(res, 400, false, `Stok tidak mencukupi. Tersisa ${product.stock} item.`);
            return;
        }
        // Calculate price
        const unitPrice = product.final_price;
        const totalPrice = unitPrice * qty;
        // Generate IDs
        const orderId = (0, database_1.generateUUID)();
        const orderNumber = (0, database_1.generateOrderNumber)();
        // Insert order
        await database_1.default.query(`INSERT INTO orders (id, order_number, user_id, user_name, user_email, user_whatsapp, product_id, product_name, qty, unit_price, total_price, payment_method, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
        ]);
        // Reduce stock
        await database_1.default.query('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, product_id]);
        // Fetch the created order
        const [orderRows] = await database_1.default.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
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
        // Non-admin can only see their own orders
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
        // Check if order exists
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
        // Update status
        await database_1.default.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
        // Fetch updated order
        const [updatedRows] = await database_1.default.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
        const updatedOrder = updatedRows[0];
        (0, response_1.sendResponse)(res, 200, true, `Status order diperbarui menjadi "${status}".`, updatedOrder);
    }
    catch (error) {
        next(error);
    }
};
exports.updateOrderStatus = updateOrderStatus;
/**
 * GET /api/v1/orders/stats/summary
 * Get order statistics (admin only)
 */
const getOrderStats = async (_req, res, next) => {
    try {
        const [totalRows] = await database_1.default.query('SELECT COUNT(*) as total FROM orders');
        const [pendingRows] = await database_1.default.query('SELECT COUNT(*) as total FROM orders WHERE status = "pending"');
        const [successRows] = await database_1.default.query('SELECT COUNT(*) as total FROM orders WHERE status = "success"');
        const [revenueRows] = await database_1.default.query('SELECT COALESCE(SUM(total_price), 0) as revenue FROM orders WHERE status = "success"');
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