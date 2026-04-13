"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const response_1 = require("../utils/response");
// ============================================================
// RGS STORE — Global Error Handler Middleware
// ============================================================
const errorHandler = (err, _req, res, _next) => {
    // Log the full error for debugging
    console.error('');
    console.error('═══ ERROR ═══════════════════════════════════');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Message:', err.message);
    if (err.stack) {
        console.error('Stack:', err.stack);
    }
    console.error('═════════════════════════════════════════════');
    console.error('');
    // Determine status code
    const statusCode = err.statusCode || err.status || 500;
    // Don't expose internal error details in production
    const message = statusCode === 500
        ? 'Terjadi kesalahan internal server. Silakan coba lagi.'
        : err.message || 'Terjadi kesalahan.';
    (0, response_1.sendResponse)(res, statusCode, false, message);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map