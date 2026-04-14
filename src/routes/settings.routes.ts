import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';

// ============================================================
// RGS STORE — Settings Routes
// ============================================================

const router: Router = Router();

// GET /api/settings — Get all settings (public)
router.get('/', getSettings);

// PUT /api/settings — Update settings (admin only)
router.put('/', verifyToken, isAdmin, updateSettings);

export default router;
