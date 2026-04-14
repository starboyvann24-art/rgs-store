"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliverOrderSchema = exports.updateOrderStatusSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
// ============================================================
// RGS STORE — Order Validation Schemas v3.1
// ============================================================
exports.createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        product_id: zod_1.z.string({ message: 'Product ID wajib diisi' }),
        qty: zod_1.z.number({ message: 'Jumlah wajib diisi' })
            .int('Jumlah harus bilangan bulat')
            .min(1, 'Jumlah minimal 1'),
        payment_method: zod_1.z.string({ message: 'Metode pembayaran wajib diisi' })
            .min(1, 'Metode pembayaran tidak boleh kosong'),
        notes: zod_1.z.string().optional()
    })
});
exports.updateOrderStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['pending', 'processing', 'shipped', 'success', 'failed', 'cancelled'], {
            message: 'Status harus salah satu dari: pending, processing, shipped, success, failed, cancelled'
        })
    })
});
exports.deliverOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        credentials: zod_1.z.string({ message: 'Kredensial wajib diisi' })
            .min(1, 'Kredensial tidak boleh kosong')
    })
});
//# sourceMappingURL=order.validation.js.map