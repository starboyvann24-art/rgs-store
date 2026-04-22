import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import db, { generateUUID } from '../config/database';
import { generateToken } from '../utils/jwt';
import { sendResponse } from '../utils/response';
import { sendResetPasswordEmail, sendOrderCreatedEmail } from '../utils/mailer';

// ============================================================
// RGS STORE — Auth Controller
// Handles user registration, login, and profile retrieval
// ============================================================


/**
 * GET /api/v1/auth/me
 * Get current logged-in user profile (requires auth token)
 */
export const getMe = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query<any>(
      'SELECT id, name, email, role, whatsapp, avatar_url, discord_id, created_at FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    const user = rows[0];
    if (!user) {
      sendResponse(res, 404, false, 'User tidak ditemukan.');
      return;
    }

    sendResponse(res, 200, true, 'Profil berhasil dimuat.', user);
  } catch (error) {
    next(error);
  }
};


/**
 * PUT /api/v1/auth/profile
 * Update user profile (name, whatsapp, avatar)
 */
export const updateProfile = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;
    const { name, whatsapp } = req.body;
    
    // Get current user data
    const [rows] = await db.query<any>('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
    const user = rows[0];
    if (!user) {
      sendResponse(res, 404, false, 'User tidak ditemukan.');
      return;
    }

    const newName = name ? name.trim() : user.name;
    const newWhatsapp = whatsapp ? whatsapp.trim() : user.whatsapp;

    await db.query(
      'UPDATE users SET name = ?, whatsapp = ? WHERE id = ?',
      [newName, newWhatsapp, userId]
    );

    const [updatedRows] = await db.query<any>('SELECT id, name, email, role, whatsapp FROM users WHERE id = ? LIMIT 1', [userId]);

    sendResponse(res, 200, true, 'Profil berhasil diperbarui.', {
      user: updatedRows[0]
    });
  } catch (error) {
    next(error);
  }
};



/**
 * GET /api/auth/logout
 * Flawless Logout
 */
export const logout = (req: Request, res: Response, _next: NextFunction): void => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout session destroy error:', err);
    }
    res.clearCookie('rgs_session_cookie');
    sendResponse(res, 200, true, 'Logout berhasil');
  });
};
