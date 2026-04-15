import { z } from 'zod';

// ============================================================
// RGS STORE — Order Validation Schemas v3.1
// ============================================================

export const createOrderSchema = z.object({
  body: z.object({
    customer_name: z.string().optional(),
    customer_email: z.string().email('Format email tidak valid').optional(),
    items: z.array(z.object({
      product_id: z.string({ message: 'Product ID wajib ada di item' }),
      qty: z.number().min(1, 'Jumlah minimal 1'),
      variant: z.string().nullable().optional(),
      name: z.string().optional(),
      price: z.number().optional()
    })).min(1, 'Keranjang belanja kosong'),
    total_price: z.number().min(0, 'Total harga tidak valid'),
    payment_method: z.string({ message: 'Metode pembayaran wajib diisi' })
      .min(1, 'Metode pembayaran tidak boleh kosong'),
    notes: z.string().optional()
  })
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'success', 'failed', 'cancelled'], {
      message: 'Status harus salah satu dari: pending, processing, shipped, success, failed, cancelled'
    })
  })
});

export const deliverOrderSchema = z.object({
  body: z.object({
    credentials: z.string({ message: 'Kredensial wajib diisi' })
      .min(1, 'Kredensial tidak boleh kosong')
  })
});
