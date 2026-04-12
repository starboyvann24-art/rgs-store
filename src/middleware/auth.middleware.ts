import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken } from '../utils/jwt';
import { sendResponse } from '../utils/response';

export interface AuthRequest extends Request {
  user?: any;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    sendResponse(res, 401, false, 'No token provided. Access denied.');
    return;
  }

  try {
    const decoded = verifyJwtToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    sendResponse(res, 401, false, 'Invalid token.');
    return;
  }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    sendResponse(res, 403, false, 'Requires admin role. Access denied.');
    return;
  }
};
