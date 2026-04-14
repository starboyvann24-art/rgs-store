import { Router } from 'express';
import {
  getPaymentMethods,
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
} from '../controllers/payment.controller';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';
import { uploadQris } from '../middleware/upload.middleware';

// ============================================================
// RGS STORE — Payment Method Routes
// ============================================================

const router: Router = Router();

// GET /api/payment-methods — Get active methods (public)
router.get('/', getPaymentMethods);

// GET /api/payment-methods/all — Get all methods (admin)
router.get('/all', verifyToken, isAdmin, getAllPaymentMethods);

// POST /api/payment-methods — Create method (admin)
router.post('/', verifyToken, isAdmin, uploadQris.single('qris_image'), createPaymentMethod);

// PUT /api/payment-methods/:id — Update method (admin)
router.put('/:id', verifyToken, isAdmin, uploadQris.single('qris_image'), updatePaymentMethod);

// DELETE /api/payment-methods/:id — Delete method (admin)
router.delete('/:id', verifyToken, isAdmin, deletePaymentMethod);

export default router;
