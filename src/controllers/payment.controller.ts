import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendResponse } from '../utils/response';

// ============================================================
// RGS STORE — Payment Method Controller
// Admin can CRUD payment methods; users can read active ones
// ============================================================

/**
 * GET /api/v1/payment-methods
 * Get all active payment methods (public)
 */
export const getPaymentMethods = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [methods] = await db.query<any>(
      'SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY id ASC'
    );

    sendResponse(res, 200, true, 'Metode pembayaran berhasil dimuat.', methods);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payment-methods/all
 * Get all payment methods including inactive (admin)
 */
export const getAllPaymentMethods = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [methods] = await db.query<any>(
      'SELECT * FROM payment_methods ORDER BY id ASC'
    );

    sendResponse(res, 200, true, 'Semua metode pembayaran dimuat.', methods);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payment-methods
 * Create a new payment method (admin)
 */
export const createPaymentMethod = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, type, account_number, account_name, logo_url } = req.body;
    let qris_image_url = null;

    if (req.file) {
      qris_image_url = `/qris/${req.file.filename}`;
    }

    if (!name || !type) {
      sendResponse(res, 400, false, 'Nama dan tipe metode pembayaran wajib diisi.');
      return;
    }

    const [result] = await db.query<any>(
      `INSERT INTO payment_methods (name, type, account_number, account_name, logo_url, qris_image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, type, account_number || null, account_name || null, logo_url || null, qris_image_url]
    );

    const [rows] = await db.query<any>(
      'SELECT * FROM payment_methods WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    sendResponse(res, 201, true, 'Metode pembayaran berhasil ditambahkan.', rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/payment-methods/:id
 * Update a payment method (admin)
 */
export const updatePaymentMethod = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const methodId = req.params.id;
    const { name, type, account_number, account_name, logo_url, is_active } = req.body;
    
    // Handle QRIS Image Upload
    let qris_image_url = req.body.qris_image_url || null;
    if (req.file) {
      qris_image_url = `/qris/${req.file.filename}`;
    }

    const [existing] = await db.query<any>(
      'SELECT id, qris_image_url FROM payment_methods WHERE id = ? LIMIT 1',
      [methodId]
    );

    if (!existing[0]) {
      sendResponse(res, 404, false, 'Metode pembayaran tidak ditemukan.');
      return;
    }

    // Use existing image if no new one provided
    if (!qris_image_url && existing[0].qris_image_url) {
      qris_image_url = existing[0].qris_image_url;
    }

    const activeVal = (is_active === 'true' || is_active === '1' || is_active === 1) ? 1 : 0;

    await db.query(
      `UPDATE payment_methods SET name = ?, type = ?, account_number = ?, account_name = ?, logo_url = ?, qris_image_url = ?, is_active = ? WHERE id = ?`,
      [name, type, account_number || null, account_name || null, logo_url || null, qris_image_url, activeVal, methodId]
    );

    const [rows] = await db.query<any>(
      'SELECT * FROM payment_methods WHERE id = ? LIMIT 1',
      [methodId]
    );

    sendResponse(res, 200, true, 'Metode pembayaran diperbarui.', rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/payment-methods/:id
 * Delete a payment method (admin)
 */
export const deletePaymentMethod = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const methodId = req.params.id;

    const [existing] = await db.query<any>(
      'SELECT id FROM payment_methods WHERE id = ? LIMIT 1',
      [methodId]
    );

    if (!existing[0]) {
      sendResponse(res, 404, false, 'Metode pembayaran tidak ditemukan.');
      return;
    }

    await db.query('DELETE FROM payment_methods WHERE id = ?', [methodId]);

    sendResponse(res, 200, true, 'Metode pembayaran berhasil dihapus.');
  } catch (error) {
    next(error);
  }
};
