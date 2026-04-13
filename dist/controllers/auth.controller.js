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
exports.getMe = exports.login = exports.register = void 0;
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
//# sourceMappingURL=auth.controller.js.map