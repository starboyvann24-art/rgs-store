"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTransactionStatus = exports.getAllTransactions = exports.getMyTransactions = exports.createTransaction = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../utils/response");
const createTransaction = async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const { product_id, qty, payment_method } = req.body;
        const [product] = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, product_id));
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
        const [newTransaction] = await db_1.db.insert(schema_1.transactions).values({
            user_id,
            product_id,
            qty,
            total_price,
            payment_method,
            status: 'pending',
        }).returning();
        // Reduce stock
        await db_1.db.update(schema_1.products).set({ stock: product.stock - qty }).where((0, drizzle_orm_1.eq)(schema_1.products.id, product_id));
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
        const myTransactions = await db_1.db.select().from(schema_1.transactions).where((0, drizzle_orm_1.eq)(schema_1.transactions.user_id, user_id));
        (0, response_1.sendResponse)(res, 200, true, 'Transactions retrieved successfully', myTransactions);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyTransactions = getMyTransactions;
const getAllTransactions = async (req, res, next) => {
    try {
        const allTransactions = await db_1.db.select().from(schema_1.transactions);
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
        const [updatedTransaction] = await db_1.db.update(schema_1.transactions).set({
            status,
            credential_data: credential_data || null,
        }).where((0, drizzle_orm_1.eq)(schema_1.transactions.id, id)).returning();
        if (!updatedTransaction) {
            (0, response_1.sendResponse)(res, 404, false, 'Transaction not found');
            return;
        }
        (0, response_1.sendResponse)(res, 200, true, 'Transaction status updated successfully', updatedTransaction);
    }
    catch (error) {
        next(error);
    }
};
exports.updateTransactionStatus = updateTransactionStatus;
