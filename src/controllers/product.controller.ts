import { Request, Response, NextFunction } from 'express';
import db, { generateUUID } from '../config/database';
import { sendResponse } from '../utils/response';

// ============================================================
// RGS STORE — Product Controller
// Handles CRUD operations for digital products
// ============================================================

/**
 * GET /api/v1/products
 * Get all active products (public — no auth required)
 */
export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    let query = 'SELECT * FROM products WHERE is_active = 1';
    const params: any[] = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [products] = await db.query<any>(query, params);

    sendResponse(res, 200, true, 'Produk berhasil dimuat.', products);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/products/all
 * Get ALL products including inactive (admin only)
 */
export const getAllProducts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [products] = await db.query<any>('SELECT * FROM products ORDER BY created_at DESC');
    sendResponse(res, 200, true, 'Semua produk berhasil dimuat.', products);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/products/:id
 * Get single product by ID (public)
 */
export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;

    const [rows] = await db.query<any>(
      'SELECT * FROM products WHERE id = ? LIMIT 1',
      [id]
    );

    const product = rows[0];
    if (!product) {
      sendResponse(res, 404, false, 'Produk tidak ditemukan.');
      return;
    }

    sendResponse(res, 200, true, 'Produk berhasil dimuat.', product);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/products
 * Create new product (admin only)
 */
export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, category, description, price, discount, stock, variants } = req.body;
    let image_url = req.body.image_url || '';

    // If file is uploaded, use local path
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const id = generateUUID();
    const parsePrice = parseInt(price) || 0;
    const parseDiscount = parseInt(discount) || 0;
    const parseStock = parseInt(stock) || 0;
    const finalPrice = Math.round(parsePrice - (parsePrice * parseDiscount / 100));

    await db.query(
      `INSERT INTO products (id, name, category, description, price, discount, final_price, stock, image_url, variants, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        id,
        name.trim(),
        category || 'Lainnya',
        description || null,
        parsePrice,
        parseDiscount,
        finalPrice,
        parseStock,
        image_url,
        variants || null
      ]
    );

    // Fetch the newly created product
    const [rows] = await db.query<any>('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
    const newProduct = rows[0];

    sendResponse(res, 201, true, 'Produk berhasil ditambahkan.', newProduct);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/products/:id
 * Update existing product (admin only)
 */
export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;
    const updates = { ...req.body };

    // Handle file upload
    if (req.file) {
      updates.image_url = `/logos/${req.file.filename}`;
    }

    // Check if product exists
    const [existingRows] = await db.query<any>(
      'SELECT * FROM products WHERE id = ? LIMIT 1',
      [id]
    );

    if (existingRows.length === 0) {
      sendResponse(res, 404, false, 'Produk tidak ditemukan.');
      return;
    }

    const existing = existingRows[0];

    // Recalculate final_price if price or discount changes
    const newPrice = updates.price !== undefined ? parseInt(updates.price) : existing.price;
    const newDiscount = updates.discount !== undefined ? parseInt(updates.discount) : existing.discount;
    updates.final_price = Math.round(newPrice - (newPrice * newDiscount / 100));

    // Build dynamic UPDATE query from provided fields
    const allowedFields = ['name', 'category', 'description', 'price', 'discount', 'final_price', 'stock', 'image_url', 'variants', 'is_active'];
    const setClauses: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        let val = updates[field];
        if (['price', 'discount', 'final_price', 'stock', 'is_active'].includes(field)) {
          val = parseInt(val);
        }
        values.push(val);
      }
    }

    if (setClauses.length === 0) {
      sendResponse(res, 400, false, 'Tidak ada data yang diubah.');
      return;
    }

    values.push(id);
    await db.query(
      `UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated product
    const [updatedRows] = await db.query<any>('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
    const updatedProduct = updatedRows[0];

    sendResponse(res, 200, true, 'Produk berhasil diperbarui.', updatedProduct);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/products/:id
 * Delete a product (admin only)
 */
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;

    const [rows] = await db.query<any>(
      'SELECT * FROM products WHERE id = ? LIMIT 1',
      [id]
    );

    const product = rows[0];
    if (!product) {
      sendResponse(res, 404, false, 'Produk tidak ditemukan.');
      return;
    }

    // Check if product has any orders
    const [orderRows] = await db.query<any>(
      'SELECT COUNT(*) as count FROM orders WHERE product_id = ?',
      [id]
    );

    if (orderRows[0].count > 0) {
      // Soft delete instead of hard delete if orders exist
      await db.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
      sendResponse(res, 200, true, 'Produk dinonaktifkan (memiliki riwayat order).', product);
      return;
    }

    await db.query('DELETE FROM products WHERE id = ?', [id]);
    sendResponse(res, 200, true, 'Produk berhasil dihapus.', product);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/products/categories/list
 * Get all unique product categories
 */
export const getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await db.query<any>(
      'SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category ASC'
    );

    const categories = rows.map((r: any) => r.category);
    sendResponse(res, 200, true, 'Kategori berhasil dimuat.', categories);
  } catch (error) {
    next(error);
  }
};
