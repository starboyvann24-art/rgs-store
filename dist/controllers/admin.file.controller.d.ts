import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * GET /api/admin/files
 * List all uploaded files in admin storage
 */
export declare const getAllFiles: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/admin/files
 * Upload a new file to admin storage
 */
export declare const uploadFile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * DELETE /api/admin/files/:filename
 * Delete a file from admin storage
 */
export declare const deleteFile: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=admin.file.controller.d.ts.map