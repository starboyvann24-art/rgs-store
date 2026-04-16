import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendResponse } from '../utils/response';

// ============================================================
// RGS STORE — Admin File Manager Controller
// Allows admins to upload, list, and delete files (PDF/PNG/etc)
// ============================================================

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'admin');

/**
 * GET /api/admin/files
 * List all uploaded files in admin storage
 */
export const getAllFiles = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const files = fs.readdirSync(UPLOAD_DIR);
    const fileList = files.map(file => {
      const stats = fs.statSync(path.join(UPLOAD_DIR, file));
      return {
        name: file,
        size: stats.size,
        created_at: stats.birthtime,
        url: `/uploads/admin/${file}`
      };
    });

    // Sort by newest first
    fileList.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    sendResponse(res, 200, true, 'Daftar berkas berhasil dimuat.', fileList);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/files
 * Upload a new file to admin storage
 */
export const uploadFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      sendResponse(res, 400, false, 'Tidak ada berkas yang diunggah.');
      return;
    }

    sendResponse(res, 201, true, 'Berkas berhasil diunggah.', {
      name: file.filename,
      url: `/uploads/admin/${file.filename}`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/files/:filename
 * Delete a file from admin storage
 */
export const deleteFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { filename } = req.params;
    const filePath = path.join(UPLOAD_DIR, filename as string);

    if (!fs.existsSync(filePath)) {
      sendResponse(res, 404, false, 'Berkas tidak ditemukan.');
      return;
    }

    fs.unlinkSync(filePath);
    sendResponse(res, 200, true, 'Berkas berhasil dihapus.');
  } catch (error) {
    next(error);
  }
};
