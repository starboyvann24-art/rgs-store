import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import db from '../config/db';
import { generateToken } from '../utils/jwt';
import { sendResponse } from '../utils/response';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, whatsapp, role } = req.body;

    const [existingUsers] = await db.query<any>('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      sendResponse(res, 400, false, 'Email is already registered');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    await db.query(
      'INSERT INTO users (id, name, email, password, whatsapp, role) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, whatsapp, role || 'user']
    );

    const newUser = { id, name, email, role: role || 'user' };

    const token = generateToken({ id: newUser.id, role: newUser.role });

    sendResponse(res, 201, true, 'User registered successfully', {
      user: newUser,
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query<any>('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) {
      sendResponse(res, 401, false, 'Invalid credentials');
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      sendResponse(res, 401, false, 'Invalid credentials');
      return;
    }

    const token = generateToken({ id: user.id, role: user.role });

    sendResponse(res, 200, true, 'Login successful', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};
