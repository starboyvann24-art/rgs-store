"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
// ============================================================
// RGS STORE — Auth Routes (Manual + Discord OAuth)
// ============================================================
const router = (0, express_1.Router)();
// ─── Passport Serialize / Deserialize ────────────────────────
// Used by Discord OAuth session flow.
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
// POST /api/auth/logout
router.post('/logout', auth_controller_1.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map