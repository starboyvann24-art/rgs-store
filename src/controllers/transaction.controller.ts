import { Response, NextFunction } from 'express';
import { db } from '../db';
import { transactions, products } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendResponse } from '../utils/response';

export const createTransaction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user.id;
    const { product_id, qty, payment_method } = req.body;

    const [product] = await db.select().from(products).where(eq(products.id, product_id));
    
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

    const [newTransaction] = await db.insert(transactions).values({
      user_id,
      product_id,
      qty,
      total_price,
      payment_method,
      status: 'pending',
    }).returning();

    // Reduce stock
    await db.update(products).set({ stock: product.stock - qty }).where(eq(products.id, product_id));

    sendResponse(res, 201, true, 'Transaction created successfully', newTransaction);
  } catch (error) {
    next(error);
  }
};

export const getMyTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user_id = req.user.id;
    const myTransactions = await db.select().from(transactions).where(eq(transactions.user_id, user_id));
    
    sendResponse(res, 200, true, 'Transactions retrieved successfully', myTransactions);
  } catch (error) {
    next(error);
  }
};

export const getAllTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const allTransactions = await db.select().from(transactions);
    sendResponse(res, 200, true, 'Transactions retrieved successfully', allTransactions);
  } catch (error) {
    next(error);
  }
};

export const updateTransactionStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, credential_data } = req.body;

    const [updatedTransaction] = await db.update(transactions).set({
      status,
      credential_data: credential_data || null,
    }).where(eq(transactions.id, id)).returning();

    if (!updatedTransaction) {
      sendResponse(res, 404, false, 'Transaction not found');
      return;
    }

    sendResponse(res, 200, true, 'Transaction status updated successfully', updatedTransaction);
  } catch (error) {
    next(error);
  }
};
