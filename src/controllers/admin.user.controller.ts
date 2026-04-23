import { Request, Response } from 'express';
import db from '../config/database';

/**
 * Get all users who have Discord ID linked
 */
export const getDiscordUsers = async (req: Request, res: Response) => {
    try {
        const [users] = await db.query(
            'SELECT id, name, email, discord_id, role, avatar_url FROM users WHERE discord_id IS NOT NULL ORDER BY id DESC'
        );
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('getDiscordUsers Error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data user Discord.' });
    }
};

/**
 * Delete a user by ID
 */
export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true, message: 'User berhasil dihapus.' });
    } catch (error) {
        console.error('deleteUser Error:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus user.' });
    }
};
