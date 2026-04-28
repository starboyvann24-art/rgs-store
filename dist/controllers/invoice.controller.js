"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInvoiceData = void 0;
const database_1 = __importDefault(require("../config/database"));
const response_1 = require("../utils/response");
const getInvoiceData = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        // We check either by primary id or order_number
        const [rows] = await database_1.default.query('SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1', [orderId, orderId]);
        const order = rows[0];
        if (!order) {
            (0, response_1.sendResponse)(res, 404, false, 'Invoice tidak ditemukan.');
            return;
        }
        (0, response_1.sendResponse)(res, 200, true, 'Invoice ditemukan.', order);
    }
    catch (error) {
        console.error('API Error (getInvoiceData):', error);
        res.json({ success: false, data: null });
    }
};
exports.getInvoiceData = getInvoiceData;
//# sourceMappingURL=invoice.controller.js.map