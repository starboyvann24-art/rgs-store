import { Response, NextFunction } from 'express';
import db from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendResponse } from '../utils/response';

export const createTransaction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user.id;
    const { product_id, qty, payment_method } = req.body;

    const [rows] = await db.query<any>('SELECT * FROM products WHERE id = ?', [product_id]);
    const product = rows[0];
    
    if (!product) {
      sendResponse(res, 404, false, 'Product not found');
      return;
    }

    if (product.stock < qty) {
      sendResponse(res, 400, false, 'Insufficient stock');
      return;
    }

    const priceAfterDiscount = product.price - (product.price * (product.discount / 100));
    const total_price = priceAfterDiscount * qty;

    const id = crypto.randomUUID();
    
    await db.query(
      'INSERT INTO transactions (id, user_id, product_id, qty, total_price, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, user_id, product_id, qty, total_price, payment_method, 'pending']
    );
    
    const [newTransactionRows] = await db.query<any>('SELECT * FROM transactions WHERE id = ?', [id]);
    const newTransaction = newTransactionRows[0];

    // Reduce stock
    await db.query('UPDATE products SET stock = ? WHERE id = ?', [product.stock - qty, product_id]);

    sendResponse(res, 201, true, 'Transaction created successfully', newTransaction);
  } catch (error) {
    next(error);
  }
};

export const getMyTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user.id;
    const [myTransactions] = await db.query<any>('SELECT * FROM transactions WHERE user_id = ?', [user_id]);
    
    sendResponse(res, 200, true, 'Transactions retrieved successfully', myTransactions);
  } catch (error) {
    next(error);
  }
};

export const getAllTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [allTransactions] = await db.query<any>('SELECT * FROM transactions');
    sendResponse(res, 200, true, 'Transactions retrieved successfully', allTransactions);
  } catch (error) {
    next(error);
  }
};

export const updateTransactionStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, credential_data } = req.body;

    const [rows] = await db.query<any>('SELECT * FROM transactions WHERE id = ?', [id]);
    const existingTransaction = rows[0];
    if (!existingTransaction) {
      sendResponse(res, 404, false, 'Transaction not found');
      return;
    }

    await db.query(
      'UPDATE transactions SET status = ?, credential_data = ? WHERE id = ?',
      [status, credential_data || null, id]
    );
    
    const [updatedRows] = await db.query<any>('SELECT * FROM transactions WHERE id = ?', [id]);
    const updatedTransaction = updatedRows[0];

    sendResponse(res, 200, true, 'Transaction status updated successfully', updatedTransaction);
  } catch (error) {
    next(error);
  }
};
