import { drizzle } from 'drizzle-orm/mysql2';
import dbConnection from '../config/db';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

export const db = drizzle(dbConnection, { schema, mode: 'default' });
