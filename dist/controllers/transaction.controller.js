"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTransactionStatus = exports.getAllTransactions = exports.getMyTransactions = exports.createTransaction = void 0;
const db_1 = __importDefault(require("../config/db"));
const response_1 = require("../utils/response");
const createTransaction = async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const { product_id, qty, payment_method } = req.body;
        const [rows] = await db_1.default.query('SELECT * FROM products WHERE id = ?', [product_id]);
        const product = rows[0];
        if (!product) {
            (0, response_1.sendResponse)(res, 404, false, 'Product not found');
            return;
        }
        if (product.stock < qty) {
            (0, response_1.sendResponse)(res, 400, false, 'Insufficient stock');
            return;
        }
        const priceAfterDiscount = product.price - (product.price * (product.discount / 100));
        const total_price = priceAfterDiscount * qty;
        const id = crypto.randomUUID();
        await db_1.default.query('INSERT INTO transactions (id, user_id, product_id, qty, total_price, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, user_id, product_id, qty, total_price, payment_method, 'pending']);
        const [newTransactionRows] = await db_1.default.query('SELECT * FROM transactions WHERE id = ?', [id]);
        const newTransaction = newTransactionRows[0];
        // Reduce stock
        await db_1.default.query('UPDATE products SET stock = ? WHERE id = ?', [product.stock - qty, product_id]);
        (0, response_1.sendResponse)(res, 201, true, 'Transaction created successfully', newTransaction);
    }
    catch (error) {
        next(error);
    }
};
exports.createTransaction = createTransaction;
const getMyTransactions = async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const [myTransactions] = await db_1.default.query('SELECT * FROM transactions WHERE user_id = ?', [user_id]);
        (0, response_1.sendResponse)(res, 200, true, 'Transactions retrieved successfully', myTransactions);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyTransactions = getMyTransactions;
const getAllTransactions = async (req, res, next) => {
    try {
        const [allTransactions] = await db_1.default.query('SELECT * FROM transactions');
        (0, response_1.sendResponse)(res, 200, true, 'Transactions retrieved successfully', allTransactions);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllTransactions = getAllTransactions;
const updateTransactionStatus = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { status, credential_data } = req.body;
        const [rows] = await db_1.default.query('SELECT * FROM transactions WHERE id = ?', [id]);
        const existingTransaction = rows[0];
        if (!existingTransaction) {
            (0, response_1.sendResponse)(res, 404, false, 'Transaction not found');
            return;
        }
        await db_1.default.query('UPDATE transactions SET status = ?, credential_data = ? WHERE id = ?', [status, credential_data || null, id]);
        const [updatedRows] = await db_1.default.query('SELECT * FROM transactions WHERE id = ?', [id]);
        const updatedTransaction = updatedRows[0];
        (0, response_1.sendResponse)(res, 200, true, 'Transaction status updated successfully', updatedTransaction);
    }
    catch (error) {
        next(error);
    }
};
exports.updateTransactionStatus = updateTransactionStatus;
