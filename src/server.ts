import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from 'passport';

// Load .env with absolute path — wajib agar terbaca di cPanel/Phusion Passenger
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { testConnection, initializeDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import settingsRoutes from './routes/settings.routes';
import ticketRoutes from './routes/ticket.routes';
import reviewRoutes from './routes/review.routes';
import paymentRoutes from './routes/payment.routes';
import messageRoutes from './routes/message.routes';
import { verifyToken, isAdmin } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { sendResponse } from './utils/response';

// ============================================================
// RGS STORE — Main Server (Node.js Monolithic for cPanel)
// Express serves both API and static frontend from /public
// ============================================================

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ─── SECURITY & PARSERS ───────────────────────────────────────
// Gunakan helmet tanpa memecah resource lokal
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 300, // Max 300 request per IP (agak longgar untuk aset statis)
  message: { success: false, message: 'Terlalu banyak permintaan, coba lagi nanti.' }
});

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50, // Max 50 request API per IP tiap 5 menit
  message: { success: false, message: 'Too many API requests, please try again later.' }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── SESSION & PASSPORT (for Google OAuth) ───────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'rgs_store_session_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));
app.use(passport.initialize());
app.use(passport.session());

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

// Explicitly serve /uploads statically as failsafe for cPanel proxy routing
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

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
apiRouter.use('/auth', apiLimiter, authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/orders', apiLimiter, orderRoutes);
apiRouter.use('/settings', settingsRoutes);
import { getOrderStats } from './controllers/order.controller';

apiRouter.use('/tickets', ticketRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/chat', messageRoutes);

// Fix API Admin Stats Routing explicitly as requested
apiRouter.get('/admin/stats', verifyToken, isAdmin, getOrderStats);

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

// ─── GLOBAL ERROR HANDLER (HARDCODE FIX) ──────────────────────
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("CRITICAL SERVER ERROR:", err);
  res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
});

// ─── START SERVER ─────────────────────────────────────────────
async function startServer(): Promise<void> {
  try {
    // Test database connection
    const dbOk = await testConnection();
    if (!dbOk) {
      console.error('❌ Failed to connect to database. Check your .env configuration.');
      process.exit(1);
    }

    // Auto-create necessary folders
    const dirs = ['uploads', 'qris', 'proofs', 'chat_files', 'avatars'];
    dirs.forEach(dir => {
      const p = path.join(__dirname, '..', 'public', dir);
      if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
        console.log(`   📂 Created directory: public/${dir}`);
      }
    });

    // Initialize database tables
    await initializeDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║         🛒  RGS STORE  v2.0.0  🛒          ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║  🌐  Server  : Running on Port ${PORT}             ║`);
      console.log(`║  📡  API     : /api                          ║`);
      console.log('║  ✅  Status  : Ready for Production          ║');
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
