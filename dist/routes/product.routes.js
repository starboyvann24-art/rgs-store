"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
// ============================================================
// RGS STORE — Product Routes
// IMPORTANT: Specific routes MUST come BEFORE parameterized /:id
// ============================================================
const router = (0, express_1.Router)();
// --- SPECIFIC ROUTES FIRST (before /:id) ---
// GET /api/v1/products/categories/list — Get distinct categories
router.get('/categories/list', product_controller_1.getCategories);
// GET /api/v1/products/admin/all — Get ALL products including inactive (admin only)
router.get('/admin/all', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, product_controller_1.getAllProducts);
// --- PUBLIC ROUTES ---
// GET /api/v1/products — Get active products (with optional ?category=&search=)
router.get('/', product_controller_1.getProducts);
// --- PARAMETERIZED ROUTES LAST ---
// GET /api/v1/products/:id — Get single product
router.get('/:id', product_controller_1.getProductById);
// --- ADMIN ROUTES (auth + admin role) ---
// POST /api/v1/products — Create new product
router.post('/', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, upload_middleware_1.uploadProductLogo.single('image'), product_controller_1.createProduct);
// PUT /api/v1/products/:id — Update product
router.put('/:id', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, upload_middleware_1.uploadProductLogo.single('image'), product_controller_1.updateProduct);
// DELETE /api/v1/products/:id — Delete product
router.delete('/:id', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, product_controller_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.routes.js.map