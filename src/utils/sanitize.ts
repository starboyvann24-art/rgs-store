/**
 * RGS STORE — Security Utilities
 * Simple HTML sanitization to prevent XSS.
 */

/**
 * Strips script tags and basic dangerous attributes from user-generated strings.
 */
export function sanitizeHTML(str: string): string {
  if (!str) return '';
  
  return str
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '') // Nuke scripts
    .replace(/on\w+="[^"]*"/gim, '')                     // Nuke event handlers
    .replace(/javascript:[^"]*/gim, '')                  // Nuke JS links
    .trim();
}

/**
 * Escapes characters for safe innerHTML injection (Frontend fallback if needed).
 */
export function escapeHTML(str: string): string {
  if (!str) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}
