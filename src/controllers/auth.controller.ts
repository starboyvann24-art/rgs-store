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
