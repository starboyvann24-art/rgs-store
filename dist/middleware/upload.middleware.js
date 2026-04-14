"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadQris = exports.uploadProductLogo = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Storage configuration with auto-folder creation
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        let destFolder = 'public/uploads';
        if (file.fieldname === 'qris_image') {
            destFolder = 'public/qris';
        }
        else if (file.fieldname === 'image') {
            destFolder = 'public/logos';
        }
        // AUTO CREATE FOLDER JIKA TIDAK ADA (INI WAJIB!)
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
    limits: { fileSize: 5 * 1024 * 1024 } // Increase to 5MB
});
// For backward compatibility in routes
exports.uploadProductLogo = exports.upload;
exports.uploadQris = exports.upload;
//# sourceMappingURL=upload.middleware.js.map