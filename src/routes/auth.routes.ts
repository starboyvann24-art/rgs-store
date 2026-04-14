import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
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

export default router;
