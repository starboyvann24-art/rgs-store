/**
 * RGS STORE — Security Utilities
 * Simple HTML sanitization to prevent XSS.
 */
/**
 * Strips script tags and basic dangerous attributes from user-generated strings.
 */
export declare function sanitizeHTML(str: string): string;
/**
 * Escapes characters for safe innerHTML injection (Frontend fallback if needed).
 */
export declare function escapeHTML(str: string): string;
//# sourceMappingURL=sanitize.d.ts.map