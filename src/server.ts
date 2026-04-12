import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import transactionRoutes from './routes/transaction.routes';
import { errorHandler } from './middleware/error.middleware';
import db from './config/db';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Main App Routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/transactions', transactionRoutes);

apiRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'API is running linearly' });
});

app.use('/api/v1', apiRouter);

// Error Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

async function testDB() {
  try {
    await db.query('SELECT 1');
    console.log('✅ Database Connected');
  } catch (err) {
    console.error('❌ Database Error:', err);
  }
}

testDB();
