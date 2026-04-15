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
exports.updateProfile = exports.resetPassword = exports.forgotPassword = exports.getMe = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importStar(require("../config/database"));
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
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
        // Simulation log
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
        console.log('-------------------------------------------');
        console.log('📧 PASSWORD RESET REQUEST');
        console.log(`To: ${email}`);
        console.log(`Link: ${resetUrl}`);
        console.log('-------------------------------------------');
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
        // Check if file is uploaded
        const avatarUrl = req.file ? `/avatars/${req.file.filename}` : undefined;
        // Get current user data
        const [rows] = await database_1.default.query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
        const user = rows[0];
        if (!user) {
            (0, response_1.sendResponse)(res, 404, false, 'User tidak ditemukan.');
            return;
        }
        const newName = name ? name.trim() : user.name;
        const newWhatsapp = whatsapp ? whatsapp.trim() : user.whatsapp;
        const newAvatar = avatarUrl || user.avatar;
        await database_1.default.query('UPDATE users SET name = ?, whatsapp = ?, avatar = ? WHERE id = ?', [newName, newWhatsapp, newAvatar, userId]);
        const [updatedRows] = await database_1.default.query('SELECT id, name, email, role, whatsapp, avatar FROM users WHERE id = ? LIMIT 1', [userId]);
        (0, response_1.sendResponse)(res, 200, true, 'Profil berhasil diperbarui.', {
            user: updatedRows[0]
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=auth.controller.js.map