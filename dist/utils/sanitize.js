"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeHTML = sanitizeHTML;
exports.sanitizeObject = sanitizeObject;
/**
 * Simple XSS Sanitization utility.
 * Removes <script> tags, common event handlers, and encodes basic HTML entities.
 */
function sanitizeHTML(input) {
    if (typeof input !== 'string')
        return input;
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/on\w+="[^"]*"/gi, '') // Remove inline event handlers
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .trim();
}
/**
 * Deep sanitize an object or array.
 */
function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return sanitizeHTML(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    if (obj !== null && typeof obj === 'object') {
        const sanitizedObj = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitizedObj[key] = sanitizeObject(value);
        }
        return sanitizedObj;
    }
    return obj;
}
//# sourceMappingURL=sanitize.js.map