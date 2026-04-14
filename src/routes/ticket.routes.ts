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
// POST /api/v1/tickets — Create new ticket
router.post('/', verifyToken, createTicket);

// GET /api/v1/tickets/me — Get my tickets
router.get('/me', verifyToken, getMyTickets);

// ADMIN ROUTES
// GET /api/v1/tickets — Get all tickets
router.get('/', verifyToken, isAdmin, getAllTickets);

// PUT /api/v1/tickets/:id/reply — Admin reply to ticket
router.put('/:id/reply', verifyToken, isAdmin, replyTicket);

// PUT /api/v1/tickets/:id/status — Update ticket status
router.put('/:id/status', verifyToken, isAdmin, updateTicketStatus);

export default router;
