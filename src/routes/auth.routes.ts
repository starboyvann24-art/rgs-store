import { Router } from 'express';
import { register, login, getMe, forgotPassword, resetPassword, updateProfile } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import { verifyToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

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

// PUT /api/auth/profile — Update user profile
router.put('/profile', verifyToken, upload.single('avatar'), updateProfile);

export default router;
