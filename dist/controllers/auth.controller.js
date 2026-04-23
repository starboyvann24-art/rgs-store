"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.updateProfile = exports.getMe = void 0;
const database_1 = __importDefault(require("../config/database"));
const response_1 = require("../utils/response");
// ============================================================
// RGS STORE — Auth Controller
// Handles user registration, login, and profile retrieval
// ============================================================
/**
 * GET /api/v1/auth/me
 * Get current logged-in user profile (requires auth token)
 */
const getMe = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const [rows] = await database_1.default.query('SELECT id, name, email, role, whatsapp, avatar_url, discord_id, created_at FROM users WHERE id = ? LIMIT 1', [userId]);
        const user = rows[0];
        if (!user) {
            (0, response_1.sendResponse)(res, 404, false, 'User tidak ditemukan.');
            return;
        }
        (0, response_1.sendResponse)(res, 200, true, 'Profil berhasil dimuat.', user);
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
/**
 * PUT /api/v1/auth/profile
 * Update user profile (name, whatsapp, avatar)
 */
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, whatsapp } = req.body;
        // Get current user data
        const [rows] = await database_1.default.query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
        const user = rows[0];
        if (!user) {
            (0, response_1.sendResponse)(res, 404, false, 'User tidak ditemukan.');
            return;
        }
        const newName = name ? name.trim() : user.name;
        const newWhatsapp = whatsapp ? whatsapp.trim() : user.whatsapp;
        await database_1.default.query('UPDATE users SET name = ?, whatsapp = ? WHERE id = ?', [newName, newWhatsapp, userId]);
        const [updatedRows] = await database_1.default.query('SELECT id, name, email, role, whatsapp FROM users WHERE id = ? LIMIT 1', [userId]);
        (0, response_1.sendResponse)(res, 200, true, 'Profil berhasil diperbarui.', {
            user: updatedRows[0]
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
/**
 * GET /api/auth/logout
 * Flawless Logout
 */
const logout = (req, res, _next) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout session destroy error:', err);
        }
        res.clearCookie('rgs_session_cookie');
        (0, response_1.sendResponse)(res, 200, true, 'Logout berhasil');
    });
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map