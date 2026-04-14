"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticket_controller_1 = require("../controllers/ticket.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
// ============================================================
// RGS STORE — CS Ticket Routes
// ============================================================
const router = (0, express_1.Router)();
// USER ROUTES
// POST /api/v1/tickets — Create new ticket
router.post('/', auth_middleware_1.verifyToken, ticket_controller_1.createTicket);
// GET /api/v1/tickets/me — Get my tickets
router.get('/me', auth_middleware_1.verifyToken, ticket_controller_1.getMyTickets);
// ADMIN ROUTES
// GET /api/v1/tickets — Get all tickets
router.get('/', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, ticket_controller_1.getAllTickets);
// PUT /api/v1/tickets/:id/reply — Admin reply to ticket
router.put('/:id/reply', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, ticket_controller_1.replyTicket);
// PUT /api/v1/tickets/:id/status — Update ticket status
router.put('/:id/status', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, ticket_controller_1.updateTicketStatus);
exports.default = router;
//# sourceMappingURL=ticket.routes.js.map