"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const sendResponse = (res, statusCode, success, message, data = null) => {
    const responseBody = {
        success,
        message,
        data
    };
    res.status(statusCode).json(responseBody);
};
exports.sendResponse = sendResponse;
//# sourceMappingURL=response.js.map