import { Router } from 'express';
import {
  getProducts,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories
} from '../controllers/product.controller';
import { validate } from '../middleware/validate.middleware';
import { createProductSchema, updateProductSchema } from '../validations/product.validation';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';
import { uploadProductLogo } from '../middleware/upload.middleware';

// ============================================================
// RGS STORE — Product Routes
// IMPORTANT: Specific routes MUST come BEFORE parameterized /:id
// ============================================================

const router: Router = Router();

// --- SPECIFIC ROUTES FIRST (before /:id) ---

// GET /api/products/categories/list — Get distinct categories
router.get('/categories/list', getCategories);

// GET /api/products/admin/all — Get ALL products including inactive (admin only)
router.get('/admin/all', verifyToken, isAdmin, getAllProducts);

// --- PUBLIC ROUTES ---

// GET /api/products — Get active products (with optional ?category=&search=)
router.get('/', getProducts);

// --- PARAMETERIZED ROUTES LAST ---

// GET /api/products/:id — Get single product
router.get('/:id', getProductById);

// --- ADMIN ROUTES (auth + admin role) ---

// POST /api/products — Create new product
router.post('/', verifyToken, isAdmin, uploadProductLogo.single('image'), createProduct);

// PUT /api/products/:id — Update product
router.put('/:id', verifyToken, isAdmin, uploadProductLogo.single('image'), updateProduct);

// DELETE /api/products/:id — Delete product
router.delete('/:id', verifyToken, isAdmin, deleteProduct);

export default router;
