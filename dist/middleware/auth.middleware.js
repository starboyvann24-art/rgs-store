"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.verifyToken = void 0;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        (0, response_1.sendResponse)(res, 401, false, 'No token provided. Access denied.');
        return;
    }
    try {
        const decoded = (0, jwt_1.verifyJwtToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        (0, response_1.sendResponse)(res, 401, false, 'Invalid token.');
        return;
    }
};
exports.verifyToken = verifyToken;
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    }
    else {
        (0, response_1.sendResponse)(res, 403, false, 'Requires admin role. Access denied.');
        return;
    }
};
exports.isAdmin = isAdmin;
