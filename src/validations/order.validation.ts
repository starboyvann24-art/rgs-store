import { z } from 'zod';

// ============================================================
// RGS STORE — Order Validation Schemas v3.1
// ============================================================

export const createOrderSchema = z.object({
  body: z.object({
    product_id: z.string({ message: 'Product ID wajib diisi' }),
    qty: z.number({ message: 'Jumlah wajib diisi' })
      .int('Jumlah harus bilangan bulat')
      .min(1, 'Jumlah minimal 1'),
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
