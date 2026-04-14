import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * POST /api/v1/tickets
 * Create a new support ticket (user)
 */
export declare const createTicket: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/tickets/me
 * Get my tickets (user)
 */
export declare const getMyTickets: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/tickets
 * Get all tickets (admin)
 */
export declare const getAllTickets: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PUT /api/v1/tickets/:id/reply
 * Admin replies to a ticket
 */
export declare const replyTicket: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PUT /api/v1/tickets/:id/status
 * Admin updates ticket status (open/closed)
 */
export declare const updateTicketStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=ticket.controller.d.ts.map