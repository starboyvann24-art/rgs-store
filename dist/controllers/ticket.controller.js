"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTicketStatus = exports.replyTicket = exports.getAllTickets = exports.getMyTickets = exports.createTicket = void 0;
const database_1 = __importStar(require("../config/database"));
const response_1 = require("../utils/response");
const discord_webhook_1 = require("../utils/discord.webhook");
// ============================================================
// RGS STORE — CS Ticket Controller
// Users submit support tickets; admins reply from dashboard
// ============================================================
/**
 * POST /api/v1/tickets
 * Create a new support ticket (user)
 */
const createTicket = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userName = req.user.name;
        const userEmail = req.user.email;
        const { subject, message } = req.body;
        const ticketId = (0, database_1.generateUUID)();
        const ticketNumber = (0, database_1.generateTicketNumber)();
        await database_1.default.query(`INSERT INTO cs_tickets (id, ticket_number, user_id, user_name, user_email, subject, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open')`, [ticketId, ticketNumber, userId, userName, userEmail, subject, message]);
        // Discord notification (non-blocking)
        (0, discord_webhook_1.sendDiscordWebhook)((0, discord_webhook_1.buildTicketEmbed)({
            ticket_number: ticketNumber,
            user_name: userName,
            subject,
            message
        })).catch(() => { });
        const [rows] = await database_1.default.query('SELECT * FROM cs_tickets WHERE id = ? LIMIT 1', [ticketId]);
        (0, response_1.sendResponse)(res, 201, true, `Tiket #${ticketNumber} berhasil dibuat. Tim kami akan segera merespons!`, rows[0]);
    }
    catch (error) {
        next(error);
    }
};
exports.createTicket = createTicket;
/**
 * GET /api/v1/tickets/me
 * Get my tickets (user)
 */
const getMyTickets = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const [tickets] = await database_1.default.query('SELECT * FROM cs_tickets WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        (0, response_1.sendResponse)(res, 200, true, 'Tiket berhasil dimuat.', tickets);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyTickets = getMyTickets;
/**
 * GET /api/v1/tickets
 * Get all tickets (admin)
 */
const getAllTickets = async (_req, res, next) => {
    try {
        const [tickets] = await database_1.default.query('SELECT * FROM cs_tickets ORDER BY status ASC, created_at DESC');
        (0, response_1.sendResponse)(res, 200, true, 'Semua tiket berhasil dimuat.', tickets);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllTickets = getAllTickets;
/**
 * PUT /api/v1/tickets/:id/reply
 * Admin replies to a ticket
 */
const replyTicket = async (req, res, next) => {
    try {
        const ticketId = req.params.id;
        const { reply } = req.body;
        if (!reply || String(reply).trim() === '') {
            (0, response_1.sendResponse)(res, 400, false, 'Balasan tidak boleh kosong.');
            return;
        }
        const [existing] = await database_1.default.query('SELECT id FROM cs_tickets WHERE id = ? LIMIT 1', [ticketId]);
        if (!existing[0]) {
            (0, response_1.sendResponse)(res, 404, false, 'Tiket tidak ditemukan.');
            return;
        }
        await database_1.default.query(`UPDATE cs_tickets SET admin_reply = ?, status = 'replied', replied_at = NOW() WHERE id = ?`, [reply, ticketId]);
        const [rows] = await database_1.default.query('SELECT * FROM cs_tickets WHERE id = ? LIMIT 1', [ticketId]);
        (0, response_1.sendResponse)(res, 200, true, 'Balasan berhasil dikirim.', rows[0]);
    }
    catch (error) {
        next(error);
    }
};
exports.replyTicket = replyTicket;
/**
 * PUT /api/v1/tickets/:id/status
 * Admin updates ticket status (open/closed)
 */
const updateTicketStatus = async (req, res, next) => {
    try {
        const ticketId = req.params.id;
        const { status } = req.body;
        if (!['open', 'replied', 'closed'].includes(status)) {
            (0, response_1.sendResponse)(res, 400, false, 'Status tidak valid. Pilih: open, replied, closed.');
            return;
        }
        await database_1.default.query('UPDATE cs_tickets SET status = ? WHERE id = ?', [status, ticketId]);
        const [rows] = await database_1.default.query('SELECT * FROM cs_tickets WHERE id = ? LIMIT 1', [ticketId]);
        (0, response_1.sendResponse)(res, 200, true, 'Status tiket diperbarui.', rows[0]);
    }
    catch (error) {
        next(error);
    }
};
exports.updateTicketStatus = updateTicketStatus;
//# sourceMappingURL=ticket.controller.js.map