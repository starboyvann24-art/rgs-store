"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.uploadFile = exports.getAllFiles = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const response_1 = require("../utils/response");
// ============================================================
// RGS STORE — Admin File Manager Controller
// Allows admins to upload, list, and delete files (PDF/PNG/etc)
// ============================================================
const UPLOAD_DIR = path_1.default.join(process.cwd(), 'public', 'uploads', 'admin');
/**
 * GET /api/admin/files
 * List all uploaded files in admin storage
 */
const getAllFiles = async (_req, res, next) => {
    try {
        if (!fs_1.default.existsSync(UPLOAD_DIR)) {
            fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
        }
        const files = fs_1.default.readdirSync(UPLOAD_DIR);
        const fileList = files.map(file => {
            const stats = fs_1.default.statSync(path_1.default.join(UPLOAD_DIR, file));
            return {
                name: file,
                size: stats.size,
                created_at: stats.birthtime,
                url: `/uploads/admin/${file}`
            };
        });
        // Sort by newest first
        fileList.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        (0, response_1.sendResponse)(res, 200, true, 'Daftar berkas berhasil dimuat.', fileList);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllFiles = getAllFiles;
/**
 * POST /api/admin/files
 * Upload a new file to admin storage
 */
const uploadFile = async (req, res, next) => {
    try {
        const file = req.file;
        if (!file) {
            (0, response_1.sendResponse)(res, 400, false, 'Tidak ada berkas yang diunggah.');
            return;
        }
        (0, response_1.sendResponse)(res, 201, true, 'Berkas berhasil diunggah.', {
            name: file.filename,
            url: `/uploads/admin/${file.filename}`
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadFile = uploadFile;
/**
 * DELETE /api/admin/files/:filename
 * Delete a file from admin storage
 */
const deleteFile = async (req, res, next) => {
    try {
        const { filename } = req.params;
        const filePath = path_1.default.join(UPLOAD_DIR, filename);
        if (!fs_1.default.existsSync(filePath)) {
            (0, response_1.sendResponse)(res, 404, false, 'Berkas tidak ditemukan.');
            return;
        }
        fs_1.default.unlinkSync(filePath);
        (0, response_1.sendResponse)(res, 200, true, 'Berkas berhasil dihapus.');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteFile = deleteFile;
//# sourceMappingURL=admin.file.controller.js.map