import { Request, Response, NextFunction } from 'express';
/**
 * GET /api/v1/settings
 * Get all public settings (no auth required)
 */
export declare const getSettings: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * PUT /api/v1/settings
 * Update settings (admin only)
 * Body: { key: value, key2: value2, ... }
 */
export declare const updateSettings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=settings.controller.d.ts.map