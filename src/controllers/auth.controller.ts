import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateToken } from '../utils/jwt';
import { sendResponse } from '../utils/response';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, whatsapp, role } = req.body;

    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      sendResponse(res, 400, false, 'Email is already registered');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      whatsapp,
      role: role || 'user',
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

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

    const [user] = await db.select().from(users).where(eq(users.email, email));
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
