"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// ============================================================
// RGS STORE — Auth Validation Schemas
// ============================================================
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ message: 'Nama wajib diisi' })
            .min(2, 'Nama minimal 2 karakter')
            .max(255, 'Nama maksimal 255 karakter'),
        email: zod_1.z.string({ message: 'Email wajib diisi' })
            .email('Format email tidak valid'),
        password: zod_1.z.string({ message: 'Password wajib diisi' })
            .min(6, 'Password minimal 6 karakter'),
        whatsapp: zod_1.z.string().optional()
    })
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ message: 'Email wajib diisi' })
            .email('Format email tidak valid'),
        password: zod_1.z.string({ message: 'Password wajib diisi' })
    })
});
//# sourceMappingURL=auth.validation.js.map