import { Request, Response, NextFunction } from 'express';
/**
 * GET /api/v1/products
 * Get all active products (public — no auth required)
 */
export declare const getProducts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/products/all
 * Get ALL products including inactive (admin only)
 */
export declare const getAllProducts: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/products/:id
 * Get single product by ID (public)
 */
export declare const getProductById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/products
 * Create new product (admin only)
 */
export declare const createProduct: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * PUT /api/v1/products/:id
 * Update existing product (admin only)
 */
export declare const updateProduct: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * DELETE /api/v1/products/:id
 * Delete a product (admin only)
 */
export declare const deleteProduct: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/products/categories/list
 * Get all unique product categories
 */
export declare const getCategories: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=product.controller.d.ts.map