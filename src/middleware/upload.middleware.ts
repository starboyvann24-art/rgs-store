import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Storage configuration with auto-folder creation
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let destFolder = 'public/uploads'; // Default to uploads
    
    if (file.fieldname === 'qris_image') {
      destFolder = 'public/qris';
    } else if (file.fieldname === 'chat_file' || file.fieldname === 'file') {
      destFolder = 'public/chat_files';
    } else if (file.fieldname === 'image') {
      destFolder = 'public/uploads';
    } else if (file.fieldname === 'payment_proof') {
      destFolder = 'public/proofs';
    } else if (file.fieldname === 'avatar') {
      destFolder = 'public/avatars';
    }
    
    // AUTO CREATE FOLDER JIKA TIDAK ADA
    const dir = path.join(process.cwd(), destFolder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for chat/images
});

// Shorthands for specific routes
export const uploadProduct = upload;
export const uploadQris = upload;
export const uploadChat = upload;

// For backward compatibility in routes
export const uploadProductLogo = upload;
