import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken, JwtPayload } from '../utils/jwt';
import { sendResponse } from '../utils/response';

// ============================================================
// RGS STORE — Authentication & Authorization Middleware
// ============================================================

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Verifies JWT token from Authorization header (Bearer <token>)
 * Attaches decoded user data to req.user
 */
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendResponse(res, 401, false, 'Akses ditolak. Token tidak ditemukan.');
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    sendResponse(res, 401, false, 'Akses ditolak. Format token tidak valid.');
    return;
  }

  try {
    const decoded = verifyJwtToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendResponse(res, 401, false, 'Token sudah kadaluarsa. Silakan login kembali.');
      return;
    }
    sendResponse(res, 401, false, 'Token tidak valid.');
    return;
  }
};

/**
 * Checks if the authenticated user has admin role
 * Must be used AFTER verifyToken middleware
 */
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    sendResponse(res, 403, false, 'Akses ditolak. Hanya admin yang diizinkan.');
    return;
  }
};
