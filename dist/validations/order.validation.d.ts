import { z } from 'zod';
export declare const createOrderSchema: z.ZodObject<{
    body: z.ZodObject<{
        product_id: z.ZodString;
        qty: z.ZodNumber;
        payment_method: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    body: z.ZodObject<{
        status: z.ZodEnum<{
            success: "success";
            pending: "pending";
            cancelled: "cancelled";
            failed: "failed";
            shipped: "shipped";
            processing: "processing";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const deliverOrderSchema: z.ZodObject<{
    body: z.ZodObject<{
        credentials: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=order.validation.d.ts.map