import { Response, NextFunction } from 'express';
import db, { generateUUID, generateTicketNumber } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendResponse } from '../utils/response';
import { sendDiscordWebhook, buildTicketEmbed } from '../utils/discord.webhook';

// ============================================================
// RGS STORE — CS Ticket Controller
// Users submit support tickets; admins reply from dashboard
// ============================================================

/**
 * POST /api/v1/tickets
 * Create a new support ticket (user)
 */
export const createTicket = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userName = req.user!.name;
    const userEmail = req.user!.email;
    const { subject, message } = req.body;

    const ticketId = generateUUID();
    const ticketNumber = generateTicketNumber();

    await db.query(
      `INSERT INTO cs_tickets (id, ticket_number, user_id, user_name, user_email, subject, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`,
      [ticketId, ticketNumber, userId, userName, userEmail, subject, message]
    );

    // Discord notification (non-blocking)
    sendDiscordWebhook(buildTicketEmbed({
      ticket_number: ticketNumber,
      user_name: userName,
      subject,
      message
    })).catch(() => {});

    const [rows] = await db.query<any>(
      'SELECT * FROM cs_tickets WHERE id = ? LIMIT 1',
      [ticketId]
    );

    sendResponse(res, 201, true, `Tiket #${ticketNumber} berhasil dibuat. Tim kami akan segera merespons!`, rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tickets/me
 * Get my tickets (user)
 */
export const getMyTickets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [tickets] = await db.query<any>(
      'SELECT * FROM cs_tickets WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    sendResponse(res, 200, true, 'Tiket berhasil dimuat.', tickets);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tickets
 * Get all tickets (admin)
 */
export const getAllTickets = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [tickets] = await db.query<any>(
      'SELECT * FROM cs_tickets ORDER BY status ASC, created_at DESC'
    );

    sendResponse(res, 200, true, 'Semua tiket berhasil dimuat.', tickets);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/tickets/:id/reply
 * Admin replies to a ticket
 */
export const replyTicket = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketId = req.params.id;
    const { reply } = req.body;

    if (!reply || String(reply).trim() === '') {
      sendResponse(res, 400, false, 'Balasan tidak boleh kosong.');
      return;
    }

    const [existing] = await db.query<any>(
      'SELECT id FROM cs_tickets WHERE id = ? LIMIT 1',
      [ticketId]
    );

    if (!existing[0]) {
      sendResponse(res, 404, false, 'Tiket tidak ditemukan.');
      return;
    }

    await db.query(
      `UPDATE cs_tickets SET admin_reply = ?, status = 'replied', replied_at = NOW() WHERE id = ?`,
      [reply, ticketId]
    );

    const [rows] = await db.query<any>(
      'SELECT * FROM cs_tickets WHERE id = ? LIMIT 1',
      [ticketId]
    );

    sendResponse(res, 200, true, 'Balasan berhasil dikirim.', rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/tickets/:id/status
 * Admin updates ticket status (open/closed)
 */
export const updateTicketStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticketId = req.params.id;
    const { status } = req.body;

    if (!['open', 'replied', 'closed'].includes(status)) {
      sendResponse(res, 400, false, 'Status tidak valid. Pilih: open, replied, closed.');
      return;
    }

    await db.query(
      'UPDATE cs_tickets SET status = ? WHERE id = ?',
      [status, ticketId]
    );

    const [rows] = await db.query<any>(
      'SELECT * FROM cs_tickets WHERE id = ? LIMIT 1',
      [ticketId]
    );

    sendResponse(res, 200, true, 'Status tiket diperbarui.', rows[0]);
  } catch (error) {
    next(error);
  }
};
