import { Router } from 'express';
import { getInvoiceData } from '../controllers/invoice.controller';

const router: Router = Router();

router.get('/:orderId', getInvoiceData);

export default router;
