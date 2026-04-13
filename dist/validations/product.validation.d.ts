import { z } from 'zod';
export declare const createProductSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        category: z.ZodDefault<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        price: z.ZodNumber;
        discount: z.ZodDefault<z.ZodNumber>;
        stock: z.ZodNumber;
        image_url: z.ZodOptional<z.ZodString>;
        variants: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateProductSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        stock: z.ZodOptional<z.ZodNumber>;
        image_url: z.ZodOptional<z.ZodString>;
        variants: z.ZodOptional<z.ZodString>;
        is_active: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=product.validation.d.ts.map