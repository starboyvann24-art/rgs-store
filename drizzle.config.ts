import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: 'localhost',
    user: 'tgevicsg_rgs_user',
    password: 'GANTI_PASSWORD_DISINI',
    database: 'tgevicsg_rgs_store',
  },
});

