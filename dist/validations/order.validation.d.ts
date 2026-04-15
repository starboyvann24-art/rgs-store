import { z } from 'zod';
export declare const createOrderSchema: z.ZodObject<{
    body: z.ZodObject<{
        customer_name: z.ZodOptional<z.ZodString>;
        customer_email: z.ZodOptional<z.ZodString>;
        items: z.ZodArray<z.ZodObject<{
            product_id: z.ZodString;
            qty: z.ZodNumber;
            variant: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            name: z.ZodOptional<z.ZodString>;
            price: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        total_price: z.ZodNumber;
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