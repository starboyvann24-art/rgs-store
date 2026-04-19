import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { register, login, getMe, forgotPassword, resetPassword, updateProfile, googleCallback, logout } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import { verifyToken } from '../middleware/auth.middleware';

// ============================================================
// RGS STORE — Auth Routes (incl. Google OAuth)
// ============================================================

const router: Router = Router();

// ─── Google Strategy ─────────────────────────────────────────
// Credentials MUST exist in .env:
//   GOOGLE_CLIENT_ID=your_client_id
//   GOOGLE_CLIENT_SECRET=your_client_secret
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID     || 'REPLACE_WITH_GOOGLE_CLIENT_ID',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'REPLACE_WITH_GOOGLE_CLIENT_SECRET',
  callbackURL:  process.env.GOOGLE_CALLBACK_URL  || 'https://rgs-store.my.id/api/auth/google/callback',
  proxy:        true  // Honours X-Forwarded-Proto from cPanel reverse proxy
}, async (_accessToken: any, _refreshToken: any, profile: any, done: any) => {
  // Pass the raw Google profile to done — googleCallback controller handles DB upsert
  return done(null, profile);
}));

// ─── Passport Serialize / Deserialize ────────────────────────
// serializeUser: called once after successful auth — stores DB user.id in session cookie.
// deserializeUser: called on every subsequent request to re-hydrate req.user from DB.
passport.serializeUser((user: any, done: any) => {
  // 'user' here is the Google profile (raw). Store profile.id as the key.
  // After googleCallback creates/finds the DB user and calls req.logIn(),
  // the session holds the DB user id (set in the controller via req.logIn).
  done(null, user.id || user);
});

passport.deserializeUser(async (id: any, done: any) => {
  try {
    const db = require('../config/database').default;
    const [rows] = await db.query(
      'SELECT id, name, email, role, whatsapp, avatar FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    const user = (rows as any[])[0];
    if (user) {
      done(null, user);
    } else {
      done(new Error('User not found in DB'), null);
    }
  } catch (err) {
    done(err, null);
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

// GET /api/auth/logout
router.post('/logout', logout);

// ─── Google OAuth Routes ──────────────────────────────────────
// Step 1 — Redirect user to Google consent screen.
// Session is needed here to store the OAuth2 state parameter (CSRF protection).
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'  // Always show account picker
  })
);

// Step 2 — Google redirects back here with ?code=...
// session: true — required so Passport can read&verify the state from the MySQL session.
// On success, calls googleCallback which issues the JWT and redirects to login.html.
router.get('/google/callback',
  passport.authenticate('google', {
    session:         true,
    failureRedirect: '/login.html?error=google_failed'
  }),
  googleCallback
);

export default router;
