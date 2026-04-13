import { z } from 'zod';

// ============================================================
// RGS STORE — Auth Validation Schemas
// ============================================================

export const registerSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Nama wajib diisi' })
      .min(2, 'Nama minimal 2 karakter')
      .max(255, 'Nama maksimal 255 karakter'),
    email: z.string({ message: 'Email wajib diisi' })
      .email('Format email tidak valid'),
    password: z.string({ message: 'Password wajib diisi' })
      .min(6, 'Password minimal 6 karakter'),
    whatsapp: z.string().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ message: 'Email wajib diisi' })
      .email('Format email tidak valid'),
    password: z.string({ message: 'Password wajib diisi' })
  })
});
