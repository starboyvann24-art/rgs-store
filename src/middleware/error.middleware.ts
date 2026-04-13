import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';

// ============================================================
// RGS STORE — Global Error Handler Middleware
// ============================================================

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
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
  const statusCode: number = err.statusCode || err.status || 500;

  // Don't expose internal error details in production
  const message: string = statusCode === 500
    ? 'Terjadi kesalahan internal server. Silakan coba lagi.'
    : err.message || 'Terjadi kesalahan.';

  sendResponse(res, statusCode, false, message);
};
