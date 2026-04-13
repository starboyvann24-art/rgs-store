"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
// ============================================================
// RGS STORE — Product Validation Schemas
// ============================================================
exports.createProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ message: 'Nama produk wajib diisi' })
            .min(1, 'Nama produk tidak boleh kosong')
            .max(255, 'Nama produk maksimal 255 karakter'),
        category: zod_1.z.string()
            .max(100, 'Kategori maksimal 100 karakter')
            .default('Lainnya'),
        description: zod_1.z.string().optional(),
        price: zod_1.z.number({ message: 'Harga wajib diisi' })
            .int('Harga harus bilangan bulat')
            .positive('Harga harus lebih dari 0'),
        discount: zod_1.z.number()
            .int()
            .min(0, 'Diskon minimal 0')
            .max(100, 'Diskon maksimal 100')
            .default(0),
        stock: zod_1.z.number({ message: 'Stok wajib diisi' })
            .int('Stok harus bilangan bulat')
            .min(0, 'Stok minimal 0'),
        image_url: zod_1.z.string().max(500).optional(),
        variants: zod_1.z.string().optional()
    })
});
exports.updateProductSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().max(255).optional(),
        category: zod_1.z.string().max(100).optional(),
        description: zod_1.z.string().optional(),
        price: zod_1.z.number().int().positive().optional(),
        discount: zod_1.z.number().int().min(0).max(100).optional(),
        stock: zod_1.z.number().int().min(0).optional(),
        image_url: zod_1.z.string().max(500).optional(),
        variants: zod_1.z.string().optional(),
        is_active: zod_1.z.number().int().min(0).max(1).optional()
    })
});
//# sourceMappingURL=product.validation.js.map