"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_file_controller_1 = require("../controllers/admin.file.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
// ============================================================
// RGS STORE — Admin General Routes
// Handles file storage and other admin-only utilities
// ============================================================
const router = (0, express_1.Router)();
// FILE STORAGE ROUTES
// GET /api/admin/files — List all admin files
router.get('/files', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, admin_file_controller_1.getAllFiles);
// POST /api/admin/files — Upload file to admin storage
router.post('/files', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, upload_middleware_1.upload.single('admin_file'), admin_file_controller_1.uploadFile);
// DELETE /api/admin/files/:filename — Delete a file
router.delete('/files/:filename', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, admin_file_controller_1.deleteFile);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map