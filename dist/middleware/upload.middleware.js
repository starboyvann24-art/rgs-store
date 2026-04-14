"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadQris = exports.uploadProductLogo = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure upload directory exists
const uploadDir = path_1.default.join(__dirname, '..', '..', 'public', 'logos');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});
// File filter (images only)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|svg/;
    const ext = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
        return cb(null, true);
    }
    cb(new Error('Hanya file gambar yang diperbolehkan!'));
};
// --- QRIS UPLOAD CONFIG ---
const qrisDir = path_1.default.join(__dirname, '..', '..', 'public', 'qris');
if (!fs_1.default.existsSync(qrisDir)) {
    fs_1.default.mkdirSync(qrisDir, { recursive: true });
}
const qrisStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, qrisDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'qris-' + uniqueSuffix + ext);
    }
});
exports.uploadProductLogo = (0, multer_1.default)({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter
});
exports.uploadQris = (0, multer_1.default)({
    storage: qrisStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter
});
//# sourceMappingURL=upload.middleware.js.map