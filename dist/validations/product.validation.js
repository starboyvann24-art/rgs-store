"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ message: 'Name is required' }),
        category: zod_1.z.string().optional(),
        price: zod_1.z.number({ message: 'Price is required' }).positive('Price must be positive'),
        discount: zod_1.z.number().int().min(0).optional(),
        stock: zod_1.z.number({ message: 'Stock is required' }).int().min(0),
        variant: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        image_base64: zod_1.z.string().optional(),
    }),
});
exports.updateProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        price: zod_1.z.number().positive().optional(),
        discount: zod_1.z.number().int().min(0).optional(),
        stock: zod_1.z.number().int().min(0).optional(),
        variant: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        image_base64: zod_1.z.string().optional(),
    }),
});
