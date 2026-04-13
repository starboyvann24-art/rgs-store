import { Response } from 'express';
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T | null;
}
export declare const sendResponse: <T = any>(res: Response, statusCode: number, success: boolean, message: string, data?: T | null) => void;
//# sourceMappingURL=response.d.ts.map