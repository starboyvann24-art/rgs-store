"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.getDiscordUsers = void 0;
const database_1 = __importDefault(require("../config/database"));
/**
 * Get all users who have Discord ID linked
 */
const getDiscordUsers = async (req, res) => {
    try {
        const [users] = await database_1.default.query('SELECT id, name, email, discord_id, role, avatar_url FROM users WHERE discord_id IS NOT NULL ORDER BY id DESC');
        res.json({ success: true, data: users });
    }
    catch (error) {
        console.error('getDiscordUsers Error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data user Discord.' });
    }
};
exports.getDiscordUsers = getDiscordUsers;
/**
 * Delete a user by ID
 */
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await database_1.default.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true, message: 'User berhasil dihapus.' });
    }
    catch (error) {
        console.error('deleteUser Error:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus user.' });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=admin.user.controller.js.map