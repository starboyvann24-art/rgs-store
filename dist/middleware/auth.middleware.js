"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.verifyToken = void 0;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
/**
 * Verifies JWT token from Authorization header (Bearer <token>)
 * Attaches decoded user data to req.user
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        (0, response_1.sendResponse)(res, 401, false, 'Akses ditolak. Token tidak ditemukan.');
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        (0, response_1.sendResponse)(res, 401, false, 'Akses ditolak. Format token tidak valid.');
        return;
    }
    try {
        const decoded = (0, jwt_1.verifyJwtToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            (0, response_1.sendResponse)(res, 401, false, 'Token sudah kadaluarsa. Silakan login kembali.');
            return;
        }
        (0, response_1.sendResponse)(res, 401, false, 'Token tidak valid.');
        return;
    }
};
exports.verifyToken = verifyToken;
/**
 * Checks if the authenticated user has admin role
 * Must be used AFTER verifyToken middleware
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    }
    else {
        (0, response_1.sendResponse)(res, 403, false, 'Akses ditolak. Hanya admin yang diizinkan.');
        return;
    }
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=auth.middleware.js.map