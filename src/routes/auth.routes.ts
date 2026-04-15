import { Router } from 'express';
import { register, login, getMe, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import { verifyToken } from '../middleware/auth.middleware';

// ============================================================
// RGS STORE — Auth Routes
// ============================================================

const router: Router = Router();

// POST /api/auth/register — Register new user
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login — Login
router.post('/login', validate(loginSchema), login);

// GET /api/auth/me — Get current user profile (protected)
router.get('/me', verifyToken, getMe);

// POST /api/auth/forgot-password — Request reset link
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password — Reset password with token
router.post('/reset-password', resetPassword);

export default router;
