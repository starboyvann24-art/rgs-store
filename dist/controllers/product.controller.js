"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const db_1 = __importDefault(require("../config/db"));
const response_1 = require("../utils/response");
const getProducts = async (req, res, next) => {
    try {
        const [allProducts] = await db_1.default.query('SELECT * FROM products');
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
        const [rows] = await db_1.default.query('SELECT * FROM products WHERE id = ?', [id]);
        const product = rows[0];
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
        const id = crypto.randomUUID();
        await db_1.default.query('INSERT INTO products (id, name, category, price, discount, stock, variant, description, image_base64) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, name, category, price, discount || 0, stock, variant, description, image_base64]);
        const [rows] = await db_1.default.query('SELECT * FROM products WHERE id = ?', [id]);
        const newProduct = rows[0];
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
        // First check if product exists
        const [rows] = await db_1.default.query('SELECT * FROM products WHERE id = ?', [id]);
        const existingProduct = rows[0];
        if (!existingProduct) {
            (0, response_1.sendResponse)(res, 404, false, 'Product not found');
            return;
        }
        const keys = Object.keys(updates);
        if (keys.length > 0) {
            const setClause = keys.map(key => `${key} = ?`).join(', ');
            const values = keys.map(key => updates[key]);
            values.push(id);
            await db_1.default.query(`UPDATE products SET ${setClause} WHERE id = ?`, values);
        }
        const [updatedRows] = await db_1.default.query('SELECT * FROM products WHERE id = ?', [id]);
        const updatedProduct = updatedRows[0];
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
        const [rows] = await db_1.default.query('SELECT * FROM products WHERE id = ?', [id]);
        const deletedProduct = rows[0];
        if (!deletedProduct) {
            (0, response_1.sendResponse)(res, 404, false, 'Product not found');
            return;
        }
        await db_1.default.query('DELETE FROM products WHERE id = ?', [id]);
        (0, response_1.sendResponse)(res, 200, true, 'Product deleted successfully', deletedProduct);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProduct = deleteProduct;
