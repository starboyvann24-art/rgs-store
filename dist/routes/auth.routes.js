"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_validation_1 = require("../validations/auth.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
// ============================================================
// RGS STORE — Auth Routes
// ============================================================
const router = (0, express_1.Router)();
// POST /api/auth/register — Register new user
router.post('/register', (0, validate_middleware_1.validate)(auth_validation_1.registerSchema), auth_controller_1.register);
// POST /api/auth/login — Login
router.post('/login', (0, validate_middleware_1.validate)(auth_validation_1.loginSchema), auth_controller_1.login);
// GET /api/auth/me — Get current user profile (protected)
router.get('/me', auth_middleware_1.verifyToken, auth_controller_1.getMe);
// POST /api/auth/forgot-password — Request reset link
router.post('/forgot-password', auth_controller_1.forgotPassword);
// POST /api/auth/reset-password — Reset password with token
router.post('/reset-password', auth_controller_1.resetPassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map