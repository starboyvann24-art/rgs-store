import { Router } from 'express';
import {
  getAllFiles,
  uploadFile,
  deleteFile
} from '../controllers/admin.file.controller';
import { getDiscordUsers, deleteUser } from '../controllers/admin.user.controller';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

// ============================================================
// RGS STORE — Admin General Routes
// Handles file storage and other admin-only utilities
// ============================================================

const router: Router = Router();

// FILE STORAGE ROUTES
router.get('/files', verifyToken, isAdmin, getAllFiles);
router.post('/files', verifyToken, isAdmin, upload.single('admin_file'), uploadFile);
router.delete('/files/:filename', verifyToken, isAdmin, deleteFile);

// USER MANAGEMENT ROUTES
router.get('/users/discord', verifyToken, isAdmin, getDiscordUsers);
router.delete('/users/:id', verifyToken, isAdmin, deleteUser);

export default router;
