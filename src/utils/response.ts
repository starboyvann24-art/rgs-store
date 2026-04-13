import { Response } from 'express';

// ============================================================
// RGS STORE — Standardized API Response Helper
// ============================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}

export const sendResponse = <T = any>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data: T | null = null
): void => {
  const responseBody: ApiResponse<T> = {
    success,
    message,
    data
  };

  res.status(statusCode).json(responseBody);
};
