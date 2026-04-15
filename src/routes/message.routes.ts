import { Router } from 'express';
import { sendMessage, getMyMessages, getChatUsers, getUserMessages } from '../controllers/message.controller';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';
import { uploadChat } from '../middleware/upload.middleware';

const router = Router();

// ============================================================
// RGS STORE — Message Routes
// Protection: All routes require login
// ============================================================

// User & Admin routes
router.post('/', verifyToken, uploadChat.single('chat_file'), sendMessage);
router.get('/', verifyToken, getMyMessages);

// Admin only routes
router.get('/users', verifyToken, isAdmin, getChatUsers);
router.get('/user/:id', verifyToken, isAdmin, getUserMessages);

export default router;
