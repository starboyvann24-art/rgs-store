import jwt, { SignOptions } from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

// ============================================================
// RGS STORE — JWT Token Utilities
// ============================================================

const JWT_SECRET: string = process.env.JWT_SECRET || 'rgs_store_default_secret_change_me';

export interface JwtPayload {
  id: string;
  role: 'user' | 'admin';
  email: string;
  name: string;
}

export const generateToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: 604800 // 7 days in seconds
  };
  return jwt.sign(payload as object, JWT_SECRET, options);
};

export const verifyJwtToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
