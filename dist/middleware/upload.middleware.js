"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProductLogo = exports.uploadChat = exports.uploadQris = exports.uploadProduct = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Storage configuration with auto-folder creation
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        let destFolder = 'public/uploads'; // Default to uploads
        if (file.fieldname === 'qris_image') {
            destFolder = 'public/qris';
        }
        else if (file.fieldname === 'chat_file' || file.fieldname === 'file') {
            destFolder = 'public/chat_files';
        }
        else if (file.fieldname === 'image') {
            destFolder = 'public/uploads';
        }
        else if (file.fieldname === 'payment_proof') {
            destFolder = 'public/proofs';
        }
        else if (file.fieldname === 'avatar') {
            destFolder = 'public/avatars';
        }
        else if (file.fieldname === 'admin_file') {
            destFolder = 'public/uploads/admin';
        }
        // AUTO CREATE FOLDER JIKA TIDAK ADA
        const dir = path_1.default.join(process.cwd(), destFolder);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path_1.default.extname(file.originalname));
    }
});
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for chat/images
});
// Shorthands for specific routes
exports.uploadProduct = exports.upload;
exports.uploadQris = exports.upload;
exports.uploadChat = exports.upload;
// For backward compatibility in routes
exports.uploadProductLogo = exports.upload;
//# sourceMappingURL=upload.middleware.js.map