import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Storage configuration with auto-folder creation
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let destFolder = 'public/uploads';
    if (file.fieldname === 'qris_image') {
      destFolder = 'public/qris';
    } else if (file.fieldname === 'image') {
      destFolder = 'public/logos';
    }
    
    // AUTO CREATE FOLDER JIKA TIDAK ADA (INI WAJIB!)
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
  limits: { fileSize: 5 * 1024 * 1024 } // Increase to 5MB
});

// For backward compatibility in routes
export const uploadProductLogo = upload;
export const uploadQris = upload;
