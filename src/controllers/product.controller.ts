import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { products } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sendResponse } from '../utils/response';

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allProducts = await db.select().from(products);
    sendResponse(res, 200, true, 'Products retrieved successfully', allProducts);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const [product] = await db.select().from(products).where(eq(products.id, id));
    
    if (!product) {
      sendResponse(res, 404, false, 'Product not found');
      return;
    }
    
    sendResponse(res, 200, true, 'Product retrieved successfully', product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, category, price, discount, stock, variant, description, image_base64 } = req.body;
    
    const [newProduct] = await db.insert(products).values({
      name,
      category,
      price,
      discount: discount || 0,
      stock,
      variant,
      description,
      image_base64,
    }).returning();
    
    sendResponse(res, 201, true, 'Product created successfully', newProduct);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updates = req.body;
    
    const [updatedProduct] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    
    if (!updatedProduct) {
      sendResponse(res, 404, false, 'Product not found');
      return;
    }
    
    sendResponse(res, 200, true, 'Product updated successfully', updatedProduct);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const [deletedProduct] = await db.delete(products).where(eq(products.id, id)).returning();
    
    if (!deletedProduct) {
      sendResponse(res, 404, false, 'Product not found');
      return;
    }
    
    sendResponse(res, 200, true, 'Product deleted successfully', deletedProduct);
  } catch (error) {
    next(error);
  }
};
