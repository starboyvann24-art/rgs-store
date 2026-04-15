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
exports.getCategories = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getAllProducts = exports.getProducts = void 0;
const database_1 = __importStar(require("../config/database"));
const response_1 = require("../utils/response");
const sanitize_1 = require("../utils/sanitize");
// ============================================================
// RGS STORE — Product Controller
// Handles CRUD operations for digital products
// ============================================================
/**
 * GET /api/v1/products
 * Get all active products (public — no auth required)
 */
const getProducts = async (req, res, next) => {
    try {
        const category = req.query.category;
        const search = req.query.search;
        let query = 'SELECT * FROM products WHERE is_active = 1';
        const params = [];
        if (category && category !== 'All') {
            query += ' AND category = ?';
            params.push(category);
        }
        if (search) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        query += ' ORDER BY created_at DESC';
        const [products] = await database_1.default.query(query, params);
        (0, response_1.sendResponse)(res, 200, true, 'Produk berhasil dimuat.', products);
    }
    catch (error) {
        next(error);
    }
};
exports.getProducts = getProducts;
/**
 * GET /api/v1/products/all
 * Get ALL products including inactive (admin only)
 */
const getAllProducts = async (_req, res, next) => {
    try {
        const [products] = await database_1.default.query('SELECT * FROM products ORDER BY created_at DESC');
        (0, response_1.sendResponse)(res, 200, true, 'Semua produk berhasil dimuat.', products);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllProducts = getAllProducts;
/**
 * GET /api/v1/products/:id
 * Get single product by ID (public)
 */
const getProductById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const [rows] = await database_1.default.query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
        const product = rows[0];
        if (!product) {
            (0, response_1.sendResponse)(res, 404, false, 'Produk tidak ditemukan.');
            return;
        }
        (0, response_1.sendResponse)(res, 200, true, 'Produk berhasil dimuat.', product);
    }
    catch (error) {
        next(error);
    }
};
exports.getProductById = getProductById;
/**
 * POST /api/v1/products
 * Create new product (admin only)
 */
const createProduct = async (req, res, next) => {
    try {
        const { name, category, description, price, discount, stock, variants } = req.body;
        let image_url = req.body.image_url || '';
        // If file is uploaded, use local path
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        }
        const id = (0, database_1.generateUUID)();
        const parsePrice = parseInt(price) || 0;
        const parseDiscount = parseInt(discount) || 0;
        const parseStock = parseInt(stock) || 0;
        const finalPrice = Math.round(parsePrice - (parsePrice * parseDiscount / 100));
        await database_1.default.query(`INSERT INTO products (id, name, category, description, price, discount, final_price, stock, image_url, variants, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, [
            id,
            name.trim(),
            category || 'Lainnya',
            (0, sanitize_1.sanitizeHTML)(description) || null,
            parsePrice,
            parseDiscount,
            finalPrice,
            parseStock,
            image_url,
            variants || null
        ]);
        // Fetch the newly created product
        const [rows] = await database_1.default.query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
        const newProduct = rows[0];
        (0, response_1.sendResponse)(res, 201, true, 'Produk berhasil ditambahkan.', newProduct);
    }
    catch (error) {
        next(error);
    }
};
exports.createProduct = createProduct;
/**
 * PUT /api/v1/products/:id
 * Update existing product (admin only)
 */
const updateProduct = async (req, res, next) => {
    try {
        const id = req.params.id;
        const updates = { ...req.body };
        // Handle file upload
        if (req.file) {
            updates.image_url = `/uploads/${req.file.filename}`;
        }
        // Check if product exists
        const [existingRows] = await database_1.default.query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
        if (existingRows.length === 0) {
            (0, response_1.sendResponse)(res, 404, false, 'Produk tidak ditemukan.');
            return;
        }
        const existing = existingRows[0];
        // Recalculate final_price if price or discount changes
        const newPrice = updates.price !== undefined ? parseInt(updates.price) : existing.price;
        const newDiscount = updates.discount !== undefined ? parseInt(updates.discount) : existing.discount;
        updates.final_price = Math.round(newPrice - (newPrice * newDiscount / 100));
        // Build dynamic UPDATE query from provided fields
        const allowedFields = ['name', 'category', 'description', 'price', 'discount', 'final_price', 'stock', 'image_url', 'variants', 'is_active'];
        const setClauses = [];
        const values = [];
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                setClauses.push(`${field} = ?`);
                let val = updates[field];
                if (field === 'description')
                    val = (0, sanitize_1.sanitizeHTML)(val);
                if (['price', 'discount', 'final_price', 'stock', 'is_active'].includes(field)) {
                    val = parseInt(val);
                }
                values.push(val);
            }
        }
        if (setClauses.length === 0) {
            (0, response_1.sendResponse)(res, 400, false, 'Tidak ada data yang diubah.');
            return;
        }
        values.push(id);
        await database_1.default.query(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`, values);
        // Fetch updated product
        const [updatedRows] = await database_1.default.query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
        const updatedProduct = updatedRows[0];
        (0, response_1.sendResponse)(res, 200, true, 'Produk berhasil diperbarui.', updatedProduct);
    }
    catch (error) {
        next(error);
    }
};
exports.updateProduct = updateProduct;
/**
 * DELETE /api/v1/products/:id
 * Delete a product (admin only)
 */
const deleteProduct = async (req, res, next) => {
    try {
        const id = req.params.id;
        const [rows] = await database_1.default.query('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
        const product = rows[0];
        if (!product) {
            (0, response_1.sendResponse)(res, 404, false, 'Produk tidak ditemukan.');
            return;
        }
        // Check if product has any orders
        const [orderRows] = await database_1.default.query('SELECT COUNT(*) as count FROM orders WHERE product_id = ?', [id]);
        if (orderRows[0].count > 0) {
            // Soft delete instead of hard delete if orders exist
            await database_1.default.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
            (0, response_1.sendResponse)(res, 200, true, 'Produk dinonaktifkan (memiliki riwayat order).', product);
            return;
        }
        await database_1.default.query('DELETE FROM products WHERE id = ?', [id]);
        (0, response_1.sendResponse)(res, 200, true, 'Produk berhasil dihapus.', product);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProduct = deleteProduct;
/**
 * GET /api/v1/products/categories/list
 * Get all unique product categories
 */
const getCategories = async (_req, res, next) => {
    try {
        const [rows] = await database_1.default.query('SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category ASC');
        const categories = rows.map((r) => r.category);
        (0, response_1.sendResponse)(res, 200, true, 'Kategori berhasil dimuat.', categories);
    }
    catch (error) {
        next(error);
    }
};
exports.getCategories = getCategories;
//# sourceMappingURL=product.controller.js.map