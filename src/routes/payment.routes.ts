import { Router } from 'express';
import {
  getPaymentMethods,
  getAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
} from '../controllers/payment.controller';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';

// ============================================================
// RGS STORE — Payment Method Routes
// ============================================================

const router: Router = Router();

// GET /api/v1/payment-methods — Get active methods (public)
router.get('/', getPaymentMethods);

// GET /api/v1/payment-methods/all — Get all methods (admin)
router.get('/all', verifyToken, isAdmin, getAllPaymentMethods);

// POST /api/v1/payment-methods — Create method (admin)
router.post('/', verifyToken, isAdmin, createPaymentMethod);

// PUT /api/v1/payment-methods/:id — Update method (admin)
router.put('/:id', verifyToken, isAdmin, updatePaymentMethod);

// DELETE /api/v1/payment-methods/:id — Delete method (admin)
router.delete('/:id', verifyToken, isAdmin, deletePaymentMethod);

export default router;
