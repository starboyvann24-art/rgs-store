import { Router } from 'express';
import {
  getAllFiles,
  uploadFile,
  deleteFile
} from '../controllers/admin.file.controller';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

// ============================================================
// RGS STORE — Admin General Routes
// Handles file storage and other admin-only utilities
// ============================================================

const router: Router = Router();

// FILE STORAGE ROUTES
// GET /api/admin/files — List all admin files
router.get('/files', verifyToken, isAdmin, getAllFiles);

// POST /api/admin/files — Upload file to admin storage
router.post('/files', verifyToken, isAdmin, upload.single('admin_file'), uploadFile);

// DELETE /api/admin/files/:filename — Delete a file
router.delete('/files/:filename', verifyToken, isAdmin, deleteFile);

export default router;
