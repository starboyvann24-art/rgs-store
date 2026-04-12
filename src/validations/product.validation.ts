import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Name is required' }),
    category: z.string().optional(),
    price: z.number({ message: 'Price is required' }).positive('Price must be positive'),
    discount: z.number().int().min(0).optional(),
    stock: z.number({ message: 'Stock is required' }).int().min(0),
    variant: z.string().optional(),
    description: z.string().optional(),
    image_base64: z.string().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    category: z.string().optional(),
    price: z.number().positive().optional(),
    discount: z.number().int().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    variant: z.string().optional(),
    description: z.string().optional(),
    image_base64: z.string().optional(),
  }),
});
