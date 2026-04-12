"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTransactionStatusSchema = exports.createTransactionSchema = void 0;
const zod_1 = require("zod");
exports.createTransactionSchema = zod_1.z.object({
    body: zod_1.z.object({
        product_id: zod_1.z.string({ message: 'Product ID is required' }).uuid('Invalid Product ID'),
        qty: zod_1.z.number({ message: 'Quantity is required' }).int().min(1, 'Quantity must be at least 1'),
        payment_method: zod_1.z.string().optional(),
    }),
});
exports.updateTransactionStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['pending', 'success', 'failed'], { message: 'Valid status is required' }),
        credential_data: zod_1.z.string().optional(),
    }),
});
