"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ message: 'Name is required' }).min(2, 'Name must be at least 2 characters'),
        email: zod_1.z.string({ message: 'Email is required' }).email('Invalid email format'),
        password: zod_1.z.string({ message: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
        whatsapp: zod_1.z.string().optional(),
        role: zod_1.z.enum(['user', 'admin']).optional(),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ message: 'Email is required' }).email('Invalid email format'),
        password: zod_1.z.string({ message: 'Password is required' }),
    }),
});
