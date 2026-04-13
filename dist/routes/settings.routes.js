"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
// ============================================================
// RGS STORE — Settings Routes
// ============================================================
const router = (0, express_1.Router)();
// GET /api/v1/settings — Get all settings (public)
router.get('/', settings_controller_1.getSettings);
// PUT /api/v1/settings — Update settings (admin only)
router.put('/', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, settings_controller_1.updateSettings);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map