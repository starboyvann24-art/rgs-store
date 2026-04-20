"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.googleCallback = exports.updateProfile = exports.resetPassword = exports.forgotPassword = exports.getMe = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importStar(require("../config/database"));
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const mailer_1 = require("../utils/mailer");
// ============================================================
// RGS STORE — Auth Controller
// Handles user registration, login, and profile retrieval
// ============================================================
/**
 * POST /api/v1/auth/register
 * Register a new user account
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password, whatsapp } = req.body;
        // Check if email already exists
        const [existingRows] = await database_1.default.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
        if (existingRows.length > 0) {
            (0, response_1.sendResponse)(res, 409, false, 'Email sudah terdaftar. Silakan gunakan email lain.');
            return;
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const id = (0, database_1.generateUUID)();
        // Insert new user (always 'user' role from registration — admin created manually)
        await database_1.default.query('INSERT INTO users (id, name, email, password, whatsapp, role) VALUES (?, ?, ?, ?, ?, ?)', [id, name.trim(), email.toLowerCase().trim(), hashedPassword, whatsapp || null, 'user']);
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
            id,
            role: 'user',
            email: email.toLowerCase().trim(),
            name: name.trim()
        });
        (0, response_1.sendResponse)(res, 201, true, 'Registrasi berhasil!', {
            user: {
                id,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                role: 'user',
                whatsapp: whatsapp || null
            },
            token
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Find user by email
        const [rows] = await database_1.default.query('SELECT id, name, email, password, role, whatsapp FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
        const user = rows[0];
        if (!user) {
            (0, response_1.sendResponse)(res, 401, false, 'Email atau password salah.');
            return;
        }
        // Compare password
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            (0, response_1.sendResponse)(res, 401, false, 'Email atau password salah.');
            return;
        }
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.name
        });
        (0, response_1.sendResponse)(res, 200, true, 'Login berhasil!', {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                whatsapp: user.whatsapp
            },
            token
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
/**
 * GET /api/v1/auth/me
 * Get current logged-in user profile (requires auth token)
 */
const getMe = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const [rows] = await database_1.default.query('SELECT id, name, email, role, whatsapp, created_at FROM users WHERE id = ? LIMIT 1', [userId]);
        const user = rows[0];
        if (!user) {
            (0, response_1.sendResponse)(res, 404, false, 'User tidak ditemukan.');
            return;
        }
        (0, response_1.sendResponse)(res, 200, true, 'Profil berhasil dimuat.', user);
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
/**
 * POST /api/v1/auth/forgot-password
 * Request a password reset link
 */
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const [userRows] = await database_1.default.query('SELECT id, name FROM users WHERE email = ? LIMIT 1', [email.toLowerCase().trim()]);
        const user = userRows[0];
        if (!user) {
            // For security, don't reveal if user exists. Just say email sent.
            (0, response_1.sendResponse)(res, 200, true, 'Jika email terdaftar, instruksi reset password akan dikirim.');
            return;
        }
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour
        await database_1.default.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?', [resetToken, expiry, user.id]);
        // Send real email via Nodemailer
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
        try {
            await (0, mailer_1.sendResetPasswordEmail)(email.toLowerCase().trim(), user.name, resetUrl);
            console.log(`📧 Reset password email sent to: ${email}`);
        }
        catch (mailErr) {
            console.error('⚠️  Email send failed (non-blocking):', mailErr);
        }
        (0, response_1.sendResponse)(res, 200, true, 'Instruksi reset password telah dikirim ke email Anda.');
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
/**
 * POST /api/v1/auth/reset-password
 * Reset password using token
 */
const resetPassword = async (req, res, next) => {
    try {
        const { token, new_password } = req.body;
        if (!token || !new_password) {
            (0, response_1.sendResponse)(res, 400, false, 'Token dan password baru wajib diisi.');
            return;
        }
        const [rows] = await database_1.default.query('SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW() LIMIT 1', [token]);
        const user = rows[0];
        if (!user) {
            (0, response_1.sendResponse)(res, 400, false, 'Token tidak valid atau sudah kedaluwarsa.');
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(new_password, 10);
        await database_1.default.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?', [hashedPassword, user.id]);
        (0, response_1.sendResponse)(res, 200, true, 'Password berhasil diperbarui. Silakan login kembali.');
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
/**
 * PUT /api/v1/auth/profile
 * Update user profile (name, whatsapp, avatar)
 */
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, whatsapp } = req.body;
        // Get current user data
        const [rows] = await database_1.default.query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
        const user = rows[0];
        if (!user) {
            (0, response_1.sendResponse)(res, 404, false, 'User tidak ditemukan.');
            return;
        }
        const newName = name ? name.trim() : user.name;
        const newWhatsapp = whatsapp ? whatsapp.trim() : user.whatsapp;
        await database_1.default.query('UPDATE users SET name = ?, whatsapp = ? WHERE id = ?', [newName, newWhatsapp, userId]);
        const [updatedRows] = await database_1.default.query('SELECT id, name, email, role, whatsapp FROM users WHERE id = ? LIMIT 1', [userId]);
        (0, response_1.sendResponse)(res, 200, true, 'Profil berhasil diperbarui.', {
            user: updatedRows[0]
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
/**
 * GET /api/auth/google/callback
 * Google OAuth callback — DB upsert + JWT issue + redirect to login.html
 *
 * Flow:
 *   1. Google redirects here with profile in req.user (set by Passport)
 *   2. We upsert the user in MySQL (create or link google_id)
 *   3. Issue a JWT token
 *   4. Redirect to /login.html?google_token=TOKEN&role=ROLE
 *   5. login.html JS saves the token to localStorage and navigates to app
 */
const googleCallback = async (req, res, _next) => {
    try {
        const profile = req.user; // Populated by Passport GoogleStrategy
        if (!profile) {
            console.error('❌ googleCallback: req.user is empty — Passport authentication failed silently.');
            res.redirect('/login.html?error=google_failed');
            return;
        }
        const email = (profile.emails?.[0]?.value || '').toLowerCase().trim();
        const name = profile.displayName || 'Google User';
        const googleId = profile.id;
        const avatarUrl = profile.photos?.[0]?.value || null;
        let role = email === 'starboyvann24@gmail.com' ? 'admin' : 'user';
        if (!email) {
            console.error('❌ googleCallback: Google profile returned no email address.');
            res.redirect('/login.html?error=no_email');
            return;
        }
        console.log(`🔐 Google OAuth callback for: ${email} (googleId: ${googleId})`);
        // ── Upsert user in DB ────────────────────────────────────
        let [rows] = await database_1.default.query('SELECT * FROM users WHERE email = ?', [email]);
        let user = rows[0];
        if (!user) {
            // Brand-new user
            const newId = (0, database_1.generateUUID)();
            await database_1.default.query("INSERT INTO users (id, name, email, google_id, role, avatar_url) VALUES (?, ?, ?, ?, 'user', ?)", [newId, name, email, googleId, avatarUrl]);
            const [newRows] = await database_1.default.query('SELECT * FROM users WHERE id = ? LIMIT 1', [newId]);
            user = newRows[0];
            console.log(`✅ googleCallback: New user created — ${email}`);
        }
        else {
            // Update existing user's google_id, avatar_url, and potentially role
            if (email === 'starboyvann24@gmail.com' || user.role === 'admin') {
                role = 'admin'; // ensure starboy gets admin, and existing admins stay admin
            }
            else {
                role = user.role;
            }
            await database_1.default.query('UPDATE users SET google_id = ?, avatar_url = ?, role = ? WHERE id = ?', [googleId, avatarUrl, role, user.id]);
            user.google_id = googleId;
            user.avatar_url = avatarUrl;
            user.role = role;
            console.log(`🔗 googleCallback: Updated existing account — ${email}`);
        }
        // ── Issue JWT ─────────────────────────────────────────────
        const token = (0, jwt_1.generateToken)({
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.name
        });
        // ── Redirect to login.html with token in query string ─────
        console.log(`🚀 googleCallback: Redirecting ${email} (role: ${user.role}) to login.html`);
        res.redirect(`/login.html?google_token=${token}&role=${user.role}`);
    }
    catch (error) {
        console.error('❌ googleCallback: Unhandled error:', error);
        res.redirect('/login.html?error=server_error');
    }
};
exports.googleCallback = googleCallback;
/**
 * GET /api/auth/logout
 * Flawless Logout
 */
const logout = (req, res, _next) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout session destroy error:', err);
        }
        res.clearCookie('rgs_session_cookie');
        (0, response_1.sendResponse)(res, 200, true, 'Logout berhasil');
    });
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map