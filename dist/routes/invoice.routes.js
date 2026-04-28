"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../controllers/invoice.controller");
const router = (0, express_1.Router)();
router.get('/:orderId', invoice_controller_1.getInvoiceData);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map