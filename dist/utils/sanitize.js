"use strict";
/**
 * RGS STORE — Security Utilities
 * Simple HTML sanitization to prevent XSS.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeHTML = sanitizeHTML;
exports.escapeHTML = escapeHTML;
/**
 * Strips script tags and basic dangerous attributes from user-generated strings.
 */
function sanitizeHTML(str) {
    if (!str)
        return '';
    return str
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '') // Nuke scripts
        .replace(/on\w+="[^"]*"/gim, '') // Nuke event handlers
        .replace(/javascript:[^"]*/gim, '') // Nuke JS links
        .trim();
}
/**
 * Escapes characters for safe innerHTML injection (Frontend fallback if needed).
 */
function escapeHTML(str) {
    if (!str)
        return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, (m) => map[m]);
}
//# sourceMappingURL=sanitize.js.map