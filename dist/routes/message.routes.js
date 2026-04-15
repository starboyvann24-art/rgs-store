"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = require("../controllers/message.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
// ============================================================
// RGS STORE — Message Routes
// Protection: All routes require login
// ============================================================
// User & Admin routes
router.post('/', auth_middleware_1.verifyToken, upload_middleware_1.uploadChat.single('chat_file'), message_controller_1.sendMessage);
router.get('/', auth_middleware_1.verifyToken, message_controller_1.getMyMessages);
// Admin only routes
router.get('/users', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, message_controller_1.getChatUsers);
router.get('/user/:id', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, message_controller_1.getUserMessages);
exports.default = router;
//# sourceMappingURL=message.routes.js.map