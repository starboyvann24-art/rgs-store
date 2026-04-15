import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendResponse } from '../utils/response';

// ============================================================
// RGS STORE — Message Controller
// Handles in-app chat between Users and Admin
// ============================================================

/**
 * POST /api/v1/messages
 * Send a message (User or Admin)
 */
export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id; // sender
    const userRole = req.user!.role;
    const { message, target_user_id } = req.body;
    let file_url = null;

    if (req.file) {
      file_url = `/chat_files/${req.file.filename}`;
    }

    // Allow empty message if there's a file
    if ((!message || message.trim() === '') && !file_url) {
      sendResponse(res, 400, false, 'Pesan atau file wajib ada.');
      return;
    }

    // Determine target (if admin sending to specific user)
    let chatUserId = userId; 
    if (userRole === 'admin' && target_user_id) {
        chatUserId = target_user_id;
    }

    const isAdmin = userRole === 'admin' ? 1 : 0;

    await db.query(
      'INSERT INTO messages (user_id, is_admin, message, file_url) VALUES (?, ?, ?, ?)',
      [chatUserId, isAdmin, message || '', file_url]
    );

    sendResponse(res, 201, true, 'Pesan terkirim.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/messages
 * Get current user's messages (Public/User)
 */
export const getMyMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [messages] = await db.query<any>(
      'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );

    sendResponse(res, 200, true, 'Pesan berhasil dimuat.', messages);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/messages/users
 * Get list of users who have chatted (Admin only)
 */
export const getChatUsers = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [users] = await db.query<any>(`
      SELECT DISTINCT m.user_id, u.name, u.email, 
      (SELECT message FROM messages WHERE user_id = m.user_id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM messages WHERE user_id = m.user_id ORDER BY created_at DESC LIMIT 1) as last_activity
      FROM messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY last_activity DESC
    `);

    sendResponse(res, 200, true, 'Daftar chat user dimuat.', users);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/messages/user/:id
 * Get specific user's chat history (Admin only)
 */
export const getUserMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetUserId = req.params.id;

    const [messages] = await db.query<any>(
      'SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC',
      [targetUserId]
    );

    sendResponse(res, 200, true, 'Pesan user berhasil dimuat.', messages);
  } catch (error) {
    next(error);
  }
};
