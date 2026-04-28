import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import { sendResponse } from '../utils/response';

export const getInvoiceData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orderId = req.params.orderId;
    
    // We check either by primary id or order_number
    const [rows] = await db.query<any>(
      'SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1',
      [orderId, orderId]
    );

    const order = rows[0];
    if (!order) {
      sendResponse(res, 404, false, 'Invoice tidak ditemukan.');
      return;
    }

    sendResponse(res, 200, true, 'Invoice ditemukan.', order);
  } catch (error) {
    console.error('API Error (getInvoiceData):', error);
    res.json({ success: false, data: null });
  }
};
