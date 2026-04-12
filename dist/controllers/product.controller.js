"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../utils/response");
const getProducts = async (req, res, next) => {
    try {
        const allProducts = await db_1.db.select().from(schema_1.products);
        (0, response_1.sendResponse)(res, 200, true, 'Products retrieved successfully', allProducts);
    }
    catch (error) {
        next(error);
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const [product] = await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
        if (!product) {
            (0, response_1.sendResponse)(res, 404, false, 'Product not found');
            return;
        }
        (0, response_1.sendResponse)(res, 200, true, 'Product retrieved successfully', product);
    }
    catch (error) {
        next(error);
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res, next) => {
    try {
        const { name, category, price, discount, stock, variant, description, image_base64 } = req.body;
        const [newProduct] = await db_1.db.insert(schema_1.products).values({
            name,
            category,
            price,
            discount: discount || 0,
            stock,
            variant,
            description,
            image_base64,
        }).returning();
        (0, response_1.sendResponse)(res, 201, true, 'Product created successfully', newProduct);
    }
    catch (error) {
        next(error);
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res, next) => {
    try {
        const id = req.params.id;
        const updates = req.body;
        const [updatedProduct] = await db_1.db.update(schema_1.products).set(updates).where((0, drizzle_orm_1.eq)(schema_1.products.id, id)).returning();
        if (!updatedProduct) {
            (0, response_1.sendResponse)(res, 404, false, 'Product not found');
            return;
        }
        (0, response_1.sendResponse)(res, 200, true, 'Product updated successfully', updatedProduct);
    }
    catch (error) {
        next(error);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res, next) => {
    try {
        const id = req.params.id;
        const [deletedProduct] = await db_1.db.delete(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.id, id)).returning();
        if (!deletedProduct) {
            (0, response_1.sendResponse)(res, 404, false, 'Product not found');
            return;
        }
        (0, response_1.sendResponse)(res, 200, true, 'Product deleted successfully', deletedProduct);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProduct = deleteProduct;
