import { z } from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    product_id: z.string({ message: 'Product ID is required' }).uuid('Invalid Product ID'),
    qty: z.number({ message: 'Quantity is required' }).int().min(1, 'Quantity must be at least 1'),
    payment_method: z.string().optional(),
  }),
});

export const updateTransactionStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'success', 'failed'], { message: 'Valid status is required' }),
    credential_data: z.string().optional(),
  }),
});
