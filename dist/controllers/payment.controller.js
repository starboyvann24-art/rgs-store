"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePaymentMethod = exports.updatePaymentMethod = exports.createPaymentMethod = exports.getAllPaymentMethods = exports.getPaymentMethods = void 0;
const database_1 = __importDefault(require("../config/database"));
const response_1 = require("../utils/response");
// ============================================================
// RGS STORE — Payment Method Controller
// Admin can CRUD payment methods; users can read active ones
// ============================================================
/**
 * GET /api/v1/payment-methods
 * Get all active payment methods (public)
 */
const getPaymentMethods = async (_req, res, next) => {
    try {
        const [methods] = await database_1.default.query('SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY id ASC');
        (0, response_1.sendResponse)(res, 200, true, 'Metode pembayaran berhasil dimuat.', methods);
    }
    catch (error) {
        next(error);
    }
};
exports.getPaymentMethods = getPaymentMethods;
/**
 * GET /api/v1/payment-methods/all
 * Get all payment methods including inactive (admin)
 */
const getAllPaymentMethods = async (_req, res, next) => {
    try {
        const [methods] = await database_1.default.query('SELECT * FROM payment_methods ORDER BY id ASC');
        (0, response_1.sendResponse)(res, 200, true, 'Semua metode pembayaran dimuat.', methods);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllPaymentMethods = getAllPaymentMethods;
/**
 * POST /api/v1/payment-methods
 * Create a new payment method (admin)
 */
const createPaymentMethod = async (req, res, next) => {
    try {
        const { name, type, account_number, account_name, logo_url } = req.body;
        if (!name || !type) {
            (0, response_1.sendResponse)(res, 400, false, 'Nama dan tipe metode pembayaran wajib diisi.');
            return;
        }
        const [result] = await database_1.default.query(`INSERT INTO payment_methods (name, type, account_number, account_name, logo_url)
       VALUES (?, ?, ?, ?, ?)`, [name, type, account_number || null, account_name || null, logo_url || null]);
        const [rows] = await database_1.default.query('SELECT * FROM payment_methods WHERE id = ? LIMIT 1', [result.insertId]);
        (0, response_1.sendResponse)(res, 201, true, 'Metode pembayaran berhasil ditambahkan.', rows[0]);
    }
    catch (error) {
        next(error);
    }
};
exports.createPaymentMethod = createPaymentMethod;
/**
 * PUT /api/v1/payment-methods/:id
 * Update a payment method (admin)
 */
const updatePaymentMethod = async (req, res, next) => {
    try {
        const methodId = req.params.id;
        const { name, type, account_number, account_name, logo_url, is_active } = req.body;
        const [existing] = await database_1.default.query('SELECT id FROM payment_methods WHERE id = ? LIMIT 1', [methodId]);
        if (!existing[0]) {
            (0, response_1.sendResponse)(res, 404, false, 'Metode pembayaran tidak ditemukan.');
            return;
        }
        await database_1.default.query(`UPDATE payment_methods SET name = ?, type = ?, account_number = ?, account_name = ?, logo_url = ?, is_active = ? WHERE id = ?`, [name, type, account_number || null, account_name || null, logo_url || null, is_active ? 1 : 0, methodId]);
        const [rows] = await database_1.default.query('SELECT * FROM payment_methods WHERE id = ? LIMIT 1', [methodId]);
        (0, response_1.sendResponse)(res, 200, true, 'Metode pembayaran diperbarui.', rows[0]);
    }
    catch (error) {
        next(error);
    }
};
exports.updatePaymentMethod = updatePaymentMethod;
/**
 * DELETE /api/v1/payment-methods/:id
 * Delete a payment method (admin)
 */
const deletePaymentMethod = async (req, res, next) => {
    try {
        const methodId = req.params.id;
        const [existing] = await database_1.default.query('SELECT id FROM payment_methods WHERE id = ? LIMIT 1', [methodId]);
        if (!existing[0]) {
            (0, response_1.sendResponse)(res, 404, false, 'Metode pembayaran tidak ditemukan.');
            return;
        }
        await database_1.default.query('DELETE FROM payment_methods WHERE id = ?', [methodId]);
        (0, response_1.sendResponse)(res, 200, true, 'Metode pembayaran berhasil dihapus.');
    }
    catch (error) {
        next(error);
    }
};
exports.deletePaymentMethod = deletePaymentMethod;
//# sourceMappingURL=payment.controller.js.map