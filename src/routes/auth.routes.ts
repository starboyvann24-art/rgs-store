import { Router } from 'express';
import passport from 'passport';
import { register, login, getMe, forgotPassword, resetPassword, updateProfile, logout } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import { verifyToken } from '../middleware/auth.middleware';

// ============================================================
// RGS STORE — Auth Routes (Manual + Discord OAuth)
// ============================================================

const router: Router = Router();

// ─── Passport Serialize / Deserialize ────────────────────────
// Used by Discord OAuth session flow.
passport.serializeUser((user: any, done: any) => {
  if (user && user.id) {
    done(null, user.id);
  } else {
    done(null, user);
  }
});

passport.deserializeUser(async (id: any, done: any) => {
  try {
    const db = require('../config/database').default;
    const [rows] = await db.query(
      'SELECT id, name, email, role, avatar_url FROM users WHERE id = ?',
      [id]
    );
    const user = (rows as any[])[0];
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (err) {
    return done(err, null);
  }
});

// ─── Standard Auth Routes ─────────────────────────────────────
// POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// GET /api/auth/me
router.get('/me', verifyToken, getMe);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// PUT /api/auth/profile
router.put('/profile', verifyToken, updateProfile);

// POST /api/auth/logout
router.post('/logout', logout);

export default router;
