import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { register, login, getMe, forgotPassword, resetPassword, updateProfile, googleCallback } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import { verifyToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

// ============================================================
// RGS STORE — Auth Routes (incl. Google OAuth)
// ============================================================

const router: Router = Router();

// ─── Setup Passport Google Strategy ──────────────────────────
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id_to_prevent_startup_crash',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
  callbackURL: 'https://rgs-store.my.id/api/auth/google/callback',
  proxy: true
}, (accessToken: any, refreshToken: any, profile: any, done: any) => {
  return done(null, profile);
}));

passport.serializeUser((user: any, done: any) => done(null, user));
passport.deserializeUser((user: any, done: any) => done(null, user));

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
router.put('/profile', verifyToken, upload.single('avatar'), updateProfile);

// ─── Google OAuth Routes ──────────────────────────────────────
// GET /api/auth/google — Initiate Google Login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /api/auth/google/callback — Google redirect back here
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login.html?error=google_failed' }),
  googleCallback
);

export default router;
