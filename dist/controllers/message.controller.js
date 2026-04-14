"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserMessages = exports.getChatUsers = exports.getMyMessages = exports.sendMessage = void 0;
const database_1 = __importDefault(require("../config/database"));
const response_1 = require("../utils/response");
// ============================================================
// RGS STORE — Message Controller
// Handles in-app chat between Users and Admin
// ============================================================
/**
 * POST /api/v1/messages
 * Send a message (User or Admin)
 */
const sendMessage = async (req, res, next) => {
    try {
        const userId = req.user.id; // sender
        const userRole = req.user.role;
        const { message, target_user_id } = req.body;
        if (!message || message.trim() === '') {
            (0, response_1.sendResponse)(res, 400, false, 'Pesan tidak boleh kosong.');
            return;
        }
        // Determine target (if admin sending to specific user)
        let chatUserId = userId;
        if (userRole === 'admin' && target_user_id) {
            chatUserId = target_user_id;
        }
        const isAdmin = userRole === 'admin' ? 1 : 0;
        await database_1.default.query('INSERT INTO messages (user_id, is_admin, message) VALUES (?, ?, ?)', [chatUserId, isAdmin, message]);
        (0, response_1.sendResponse)(res, 201, true, 'Pesan terkirim.');
    }
    catch (error) {
        next(error);
    }
};
exports.sendMessage = sendMessage;
/**
 * GET /api/v1/messages
 * Get current user's messages (Public/User)
 */
const getMyMessages = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const [messages] = await database_1.default.query('SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC', [userId]);
        (0, response_1.sendResponse)(res, 200, true, 'Pesan berhasil dimuat.', messages);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyMessages = getMyMessages;
/**
 * GET /api/v1/messages/users
 * Get list of users who have chatted (Admin only)
 */
const getChatUsers = async (_req, res, next) => {
    try {
        const [users] = await database_1.default.query(`
      SELECT DISTINCT m.user_id, u.name, u.email, 
      (SELECT message FROM messages WHERE user_id = m.user_id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM messages WHERE user_id = m.user_id ORDER BY created_at DESC LIMIT 1) as last_activity
      FROM messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY last_activity DESC
    `);
        (0, response_1.sendResponse)(res, 200, true, 'Daftar chat user dimuat.', users);
    }
    catch (error) {
        next(error);
    }
};
exports.getChatUsers = getChatUsers;
/**
 * GET /api/v1/messages/user/:id
 * Get specific user's chat history (Admin only)
 */
const getUserMessages = async (req, res, next) => {
    try {
        const targetUserId = req.params.id;
        const [messages] = await database_1.default.query('SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC', [targetUserId]);
        (0, response_1.sendResponse)(res, 200, true, 'Pesan user berhasil dimuat.', messages);
    }
    catch (error) {
        next(error);
    }
};
exports.getUserMessages = getUserMessages;
//# sourceMappingURL=message.controller.js.map