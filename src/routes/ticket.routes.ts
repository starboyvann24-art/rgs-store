import { Router } from 'express';
import {
  createTicket,
  getMyTickets,
  getAllTickets,
  replyTicket,
  updateTicketStatus
} from '../controllers/ticket.controller';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';

// ============================================================
// RGS STORE — CS Ticket Routes
// ============================================================

const router: Router = Router();

// USER ROUTES
// POST /api/tickets — Create new ticket
router.post('/', verifyToken, createTicket);

// GET /api/tickets/me — Get my tickets
router.get('/me', verifyToken, getMyTickets);

// ADMIN ROUTES
// GET /api/tickets — Get all tickets
router.get('/', verifyToken, isAdmin, getAllTickets);

// PUT /api/tickets/:id/reply — Admin reply to ticket
router.put('/:id/reply', verifyToken, isAdmin, replyTicket);

// PUT /api/tickets/:id/status — Update ticket status
router.put('/:id/status', verifyToken, isAdmin, updateTicketStatus);

export default router;
