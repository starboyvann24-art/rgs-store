import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import * as dotenv from 'dotenv';

// Load .env with absolute path — wajib agar terbaca di cPanel/Phusion Passenger
// __dirname di dist/server.js → naik 1 level → root project
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { testConnection, initializeDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import settingsRoutes from './routes/settings.routes';
import ticketRoutes from './routes/ticket.routes';
import reviewRoutes from './routes/review.routes';
import paymentRoutes from './routes/payment.routes';
import { verifyToken, isAdmin } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { sendResponse } from './utils/response';

// ============================================================
// RGS STORE — Main Server (Node.js Monolithic for cPanel)
// Express serves both API and static frontend from /public
// ============================================================

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ─── BODY PARSERS ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── ADMIN PROTECTION (Before Static) ────────────────────────
// Protect /admin.html from unauthorized access
app.get(['/admin', '/admin.html'], verifyToken, isAdmin, (req, res, next) => {
  next(); // Allow if admin
});

// Fallback for non-admin attempts (since static matches after)
app.use(['/admin', '/admin.html'], (req, res, next) => {
  // If we reach here without verifyToken/isAdmin passing, it's either unauth or non-admin
  res.redirect('/index.html');
});

// ─── STATIC FILES (Frontend) ─────────────────────────────────
// Serve all files from /public directory (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── API ROUTES ───────────────────────────────────────────────
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'RGS STORE API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Mount route modules
apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/tickets', ticketRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/payment-methods', paymentRoutes);

// Register API router under /api
app.use('/api', apiRouter);

// ─── 404 HANDLER FOR API ROUTES ───────────────────────────────
// Only triggered if /api/* doesn't match anything in apiRouter
app.use('/api', (req: Request, res: Response) => {
  console.log(`⚠️  Rute nyasar (API 404): ${req.method} ${req.originalUrl}`);
  sendResponse(res, 404, false, `API endpoint not found: ${req.method} ${req.originalUrl}`);
});

// ─── SPA FALLBACK ─────────────────────────────────────────────
// All non-API routes serve index.html (for frontend routing)
app.use((_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────
app.use(errorHandler);

// ─── START SERVER ─────────────────────────────────────────────
async function startServer(): Promise<void> {
  try {
    // Test database connection
    const dbOk = await testConnection();
    if (!dbOk) {
      console.error('❌ Failed to connect to database. Check your .env configuration.');
      process.exit(1);
    }

    // Initialize database tables
    await initializeDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║         🛒  RGS STORE  v2.0.0  🛒          ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║  🌐  Server  : http://localhost:${PORT}         ║`);
      console.log(`║  📡  API     : http://localhost:${PORT}/api/v1   ║`);
      console.log('║  ✅  Status  : Running                       ║');
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
