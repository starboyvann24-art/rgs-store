import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendResponse } from '../utils/response';

// ============================================================
// RGS STORE — Request Validation Middleware (Zod)
// ============================================================

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }));
        sendResponse(res, 400, false, 'Validasi gagal', errors);
        return;
      }
      next(error);
    }
  };
};
