import { Request } from 'express';
import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'public', 'logos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

// File filter (images only)
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|webp|svg/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    return cb(null, true);
  }
  cb(new Error('Hanya file gambar yang diperbolehkan!'));
};

// --- QRIS UPLOAD CONFIG ---

const qrisDir = path.join(__dirname, '..', '..', 'public', 'qris');
if (!fs.existsSync(qrisDir)) {
  fs.mkdirSync(qrisDir, { recursive: true });
}

const qrisStorage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, qrisDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'qris-' + uniqueSuffix + ext);
  }
});

export const uploadProductLogo = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter
});

export const uploadQris = multer({
  storage: qrisStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter
});
