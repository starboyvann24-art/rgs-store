import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import { sendResponse } from '../utils/response';

// ============================================================
// RGS STORE — Settings Controller
// Public settings endpoint and admin update
// ============================================================

/**
 * GET /api/v1/settings
 * Get all public settings (no auth required)
 */
export const getSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [rows] = await db.query<any>('SELECT setting_key, setting_value FROM settings');

    // Convert array of {setting_key, setting_value} to a flat object
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }

    sendResponse(res, 200, true, 'Settings berhasil dimuat.', settings);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/settings
 * Update settings (admin only)
 * Body: { key: value, key2: value2, ... }
 */
export const updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      sendResponse(res, 400, false, 'Tidak ada data yang diubah.');
      return;
    }

    for (const [key, value] of Object.entries(updates)) {
      await db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }

    // Return updated settings
    const [rows] = await db.query<any>('SELECT setting_key, setting_value FROM settings');
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.setting_key] = row.setting_value;
    }

    sendResponse(res, 200, true, 'Settings berhasil diperbarui.', settings);
  } catch (error) {
    next(error);
  }
};
