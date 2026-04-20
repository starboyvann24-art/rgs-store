"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
// ============================================================
// RGS STORE — Auth Routes (incl. Google OAuth)
// ============================================================
const router = (0, express_1.Router)();
// ─── Google Strategy ─────────────────────────────────────────
// Credentials MUST exist in .env:
//   GOOGLE_CLIENT_ID=your_client_id
//   GOOGLE_CLIENT_SECRET=your_client_secret
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'REPLACE_WITH_GOOGLE_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'REPLACE_WITH_GOOGLE_CLIENT_SECRET',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://rgs-store.my.id/api/auth/google/callback',
    proxy: true // Honours X-Forwarded-Proto from cPanel reverse proxy
}, async (_accessToken, _refreshToken, profile, done) => {
    // Pass the raw Google profile to done — googleCallback controller handles DB upsert
    return done(null, profile);
}));
// ─── Passport Serialize / Deserialize ────────────────────────
// serializeUser: called once after successful auth — stores DB user.id in session cookie.
// deserializeUser: called on every subsequent request to re-hydrate req.user from DB.
passport_1.default.serializeUser((user, done) => {
    if (user && user.id) {
        done(null, user.id);
    }
    else {
        done(null, user);
    }
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const db = require('../config/database').default;
        const [rows] = await db.query('SELECT id, name, email, role, avatar_url FROM users WHERE id = ?', [id]);
        const user = rows[0];
        if (user) {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    }
    catch (err) {
        return done(err, null);
    }
});
// ─── Standard Auth Routes ─────────────────────────────────────
// POST /api/auth/register
router.post('/register', (0, validate_middleware_1.validate)(auth_validation_1.registerSchema), auth_controller_1.register);
// POST /api/auth/login
router.post('/login', (0, validate_middleware_1.validate)(auth_validation_1.loginSchema), auth_controller_1.login);
// GET /api/auth/me
router.get('/me', auth_middleware_1.verifyToken, auth_controller_1.getMe);
// POST /api/auth/forgot-password
router.post('/forgot-password', auth_controller_1.forgotPassword);
// POST /api/auth/reset-password
router.post('/reset-password', auth_controller_1.resetPassword);
// PUT /api/auth/profile
router.put('/profile', auth_middleware_1.verifyToken, auth_controller_1.updateProfile);
// GET /api/auth/logout
router.post('/logout', auth_controller_1.logout);
// ─── Google OAuth Routes ──────────────────────────────────────
// Step 1 — Redirect user to Google consent screen.
// Session is needed here to store the OAuth2 state parameter (CSRF protection).
router.get('/google', passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account' // Always show account picker
}));
// Step 2 — Google redirects back here with ?code=...
// session: true — required so Passport can read&verify the state from the MySQL session.
// On success, calls googleCallback which issues the JWT and redirects to login.html.
router.get('/google/callback', passport_1.default.authenticate('google', {
    session: true,
    failureRedirect: '/login.html?error=google_failed'
}), auth_controller_1.googleCallback);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map