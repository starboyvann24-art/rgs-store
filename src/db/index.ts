import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

const poolConnection = mysql.createPool(process.env.DATABASE_URL as string);

export const db = drizzle(poolConnection, { schema, mode: 'default' });
