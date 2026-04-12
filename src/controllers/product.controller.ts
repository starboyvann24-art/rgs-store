import { Request, Response, NextFunction } from 'express';
import db from '../config/db';
import { sendResponse } from '../utils/response';

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [allProducts] = await db.query<any>('SELECT * FROM products');
    sendResponse(res, 200, true, 'Products retrieved successfully', allProducts);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const [rows] = await db.query<any>('SELECT * FROM products WHERE id = ?', [id]);
    const product = rows[0];
    
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
    
    const id = crypto.randomUUID();
    
    await db.query(
      'INSERT INTO products (id, name, category, price, discount, stock, variant, description, image_base64) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, category, price, discount || 0, stock, variant, description, image_base64]
    );
    
    const [rows] = await db.query<any>('SELECT * FROM products WHERE id = ?', [id]);
    const newProduct = rows[0];
    
    sendResponse(res, 201, true, 'Product created successfully', newProduct);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updates = req.body;
    
    // First check if product exists
    const [rows] = await db.query<any>('SELECT * FROM products WHERE id = ?', [id]);
    const existingProduct = rows[0];
    if (!existingProduct) {
      sendResponse(res, 404, false, 'Product not found');
      return;
    }

    const keys = Object.keys(updates);
    if (keys.length > 0) {
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      const values = keys.map(key => updates[key]);
      values.push(id);
      await db.query(`UPDATE products SET ${setClause} WHERE id = ?`, values);
    }
    
    const [updatedRows] = await db.query<any>('SELECT * FROM products WHERE id = ?', [id]);
    const updatedProduct = updatedRows[0];
    
    sendResponse(res, 200, true, 'Product updated successfully', updatedProduct);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const [rows] = await db.query<any>('SELECT * FROM products WHERE id = ?', [id]);
    const deletedProduct = rows[0];
    if (!deletedProduct) {
      sendResponse(res, 404, false, 'Product not found');
      return;
    }

    await db.query('DELETE FROM products WHERE id = ?', [id]);
    
    sendResponse(res, 200, true, 'Product deleted successfully', deletedProduct);
  } catch (error) {
    next(error);
  }
};
