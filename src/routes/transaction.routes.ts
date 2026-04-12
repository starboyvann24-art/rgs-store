import { Router } from 'express';
import { createTransaction, getMyTransactions, getAllTransactions, updateTransactionStatus } from '../controllers/transaction.controller';
import { validate } from '../middleware/validate.middleware';
import { createTransactionSchema, updateTransactionStatusSchema } from '../validations/transaction.validation';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';

const router: Router = Router();

router.post('/', verifyToken, validate(createTransactionSchema), createTransaction);
router.get('/me', verifyToken, getMyTransactions);
router.get('/', verifyToken, isAdmin, getAllTransactions);
router.put('/:id/status', verifyToken, isAdmin, validate(updateTransactionStatusSchema), updateTransactionStatus);

export default router;
