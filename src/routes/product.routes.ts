import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller';
import { validate } from '../middleware/validate.middleware';
import { createProductSchema, updateProductSchema } from '../validations/product.validation';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';

const router: Router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', verifyToken, isAdmin, validate(createProductSchema), createProduct);
router.put('/:id', verifyToken, isAdmin, validate(updateProductSchema), updateProduct);
router.delete('/:id', verifyToken, isAdmin, deleteProduct);

export default router;
