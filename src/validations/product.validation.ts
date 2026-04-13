import { z } from 'zod';

// ============================================================
// RGS STORE — Product Validation Schemas
// ============================================================

export const createProductSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Nama produk wajib diisi' })
      .min(1, 'Nama produk tidak boleh kosong')
      .max(255, 'Nama produk maksimal 255 karakter'),
    category: z.string()
      .max(100, 'Kategori maksimal 100 karakter')
      .default('Lainnya'),
    description: z.string().optional(),
    price: z.number({ message: 'Harga wajib diisi' })
      .int('Harga harus bilangan bulat')
      .positive('Harga harus lebih dari 0'),
    discount: z.number()
      .int()
      .min(0, 'Diskon minimal 0')
      .max(100, 'Diskon maksimal 100')
      .default(0),
    stock: z.number({ message: 'Stok wajib diisi' })
      .int('Stok harus bilangan bulat')
      .min(0, 'Stok minimal 0'),
    image_url: z.string().max(500).optional(),
    variants: z.string().optional()
  })
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().max(255).optional(),
    category: z.string().max(100).optional(),
    description: z.string().optional(),
    price: z.number().int().positive().optional(),
    discount: z.number().int().min(0).max(100).optional(),
    stock: z.number().int().min(0).optional(),
    image_url: z.string().max(500).optional(),
    variants: z.string().optional(),
    is_active: z.number().int().min(0).max(1).optional()
  })
});
