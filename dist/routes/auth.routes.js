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
const upload_middleware_1 = require("../middleware/upload.middleware");
// ============================================================
// RGS STORE — Auth Routes (incl. Google OAuth)
// ============================================================
const router = (0, express_1.Router)();
// ─── Setup Passport Google Strategy ──────────────────────────
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id_to_prevent_startup_crash',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
    callbackURL: 'https://rgs-store.my.id/api/auth/google/callback',
    proxy: true
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));
// ─── Passport Serialize/Deserialize (DB-backed) ──────────────
// Store only the user ID in session, lookup from DB on each request
passport_1.default.serializeUser((user, done) => {
    // The 'user' here is populated by the Google strategy callback
    // We store only the google profile id temporarily; JWT is the real auth
    done(null, user.id || user);
});
passport_1.default.deserializeUser(async (id, done) => {
    // We use JWT for real auth, session is only needed for OAuth handshake
    // Just pass through the stored id
    done(null, id);
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
router.put('/profile', auth_middleware_1.verifyToken, upload_middleware_1.upload.single('avatar'), auth_controller_1.updateProfile);
// ─── Google OAuth Routes ──────────────────────────────────────
// GET /api/auth/google — Initiate Google Login
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
// GET /api/auth/google/callback — Google redirect back here
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/login.html?error=google_failed' }), auth_controller_1.googleCallback);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map