import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  sendResponse(res, statusCode, false, message, null);
};
