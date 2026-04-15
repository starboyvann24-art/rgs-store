import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import db, { generateUUID } from '../config/database';
import { generateToken } from '../utils/jwt';
import { sendResponse } from '../utils/response';

// ============================================================
// RGS STORE — Auth Controller
// Handles user registration, login, and profile retrieval
// ============================================================

/**
 * POST /api/v1/auth/register
 * Register a new user account
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, whatsapp } = req.body;

    // Check if email already exists
    const [existingRows] = await db.query<any>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (existingRows.length > 0) {
      sendResponse(res, 409, false, 'Email sudah terdaftar. Silakan gunakan email lain.');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = generateUUID();

    // Insert new user (always 'user' role from registration — admin created manually)
    await db.query(
      'INSERT INTO users (id, name, email, password, whatsapp, role) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name.trim(), email.toLowerCase().trim(), hashedPassword, whatsapp || null, 'user']
    );

    // Generate JWT token
    const token = generateToken({
      id,
      role: 'user',
      email: email.toLowerCase().trim(),
      name: name.trim()
    });

    sendResponse(res, 201, true, 'Registrasi berhasil!', {
      user: {
        id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: 'user',
        whatsapp: whatsapp || null
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const [rows] = await db.query<any>(
      'SELECT id, name, email, password, role, whatsapp FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );

    const user = rows[0];
    if (!user) {
      sendResponse(res, 401, false, 'Email atau password salah.');
      return;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      sendResponse(res, 401, false, 'Email atau password salah.');
      return;
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name
    });

    sendResponse(res, 200, true, 'Login berhasil!', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        whatsapp: user.whatsapp
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 * Get current logged-in user profile (requires auth token)
 */
export const getMe = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query<any>(
      'SELECT id, name, email, role, whatsapp, created_at FROM users WHERE id = ? LIMIT 1',
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
 * POST /api/v1/auth/forgot-password
 * Request a password reset link
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const [userRows] = await db.query<any>('SELECT id, name FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
    const user = userRows[0];

    if (!user) {
      // For security, don't reveal if user exists. Just say email sent.
      sendResponse(res, 200, true, 'Jika email terdaftar, instruksi reset password akan dikirim.');
      return;
    }

    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetToken, expiry, user.id]
    );

    // Simulation log
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
    console.log('-------------------------------------------');
    console.log('📧 PASSWORD RESET REQUEST');
    console.log(`To: ${email}`);
    console.log(`Link: ${resetUrl}`);
    console.log('-------------------------------------------');

    sendResponse(res, 200, true, 'Instruksi reset password telah dikirim ke email Anda.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/reset-password
 * Reset password using token
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      sendResponse(res, 400, false, 'Token dan password baru wajib diisi.');
      return;
    }

    const [rows] = await db.query<any>(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW() LIMIT 1',
      [token]
    );

    const user = rows[0];
    if (!user) {
      sendResponse(res, 400, false, 'Token tidak valid atau sudah kedaluwarsa.');
      return;
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await db.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    sendResponse(res, 200, true, 'Password berhasil diperbarui. Silakan login kembali.');
  } catch (error) {
    next(error);
  }
};
