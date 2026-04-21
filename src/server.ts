import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from 'passport';
import mysql2 from 'mysql2';

// ─── MySQL Session Store (express-mysql-session) ─────────────
// MUST be required — not imported — for CJS interop
const MySQLStore = require('express-mysql-session')(session);

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
import adminRoutes from './routes/admin.routes';
import { verifyToken, isAdmin } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { sendResponse } from './utils/response';
import { getOrderStats } from './controllers/order.controller';

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

// ─── TRUST PROXY ─────────────────────────────────────────────
// MANDATORY for cPanel / Phusion Passenger / Reverse Proxy.
// Must be declared BEFORE session middleware.
app.set('trust proxy', 1);

// ─── CORS (MANDATORY for Cookies/Sessions) ───────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ─── SESSION STORE — MySQL Backed (Anti-Amnesia) ──────────────
// Uses a dedicated NON-PROMISE mysql2 pool (required by express-mysql-session).
// This is separate from the app's promise pool in config/database.ts.
const sessionDbPool = mysql2.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  port:              parseInt(process.env.DB_PORT || '3306', 10),
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASSWORD || '',
  database:          process.env.DB_NAME     || 'tgevcisg_rgs_store',
  waitForConnections: true,
  connectionLimit:   5,
  charset:           'utf8mb4'
});

const sessionStore = new MySQLStore({
  clearExpired:            true,
  checkExpirationInterval: 900000,   // Prune expired sessions every 15 min
  expiration:              86400000, // Session max age: 24h
  createDatabaseTable:     true,     // Auto-create `sessions` table if missing
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires:    'expires',
      data:       'data'
    }
  }
}, sessionDbPool);

// ─── SESSION & PASSPORT ───────────────────────────────────────
app.use(session({
  name:              'rgs_session_cookie',
  secret:            process.env.SESSION_SECRET || 'rgs_super_secret_session_2026',
  store:             sessionStore,
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   true,
    sameSite: 'none',
    maxAge:   24 * 60 * 60 * 1000 // 24h
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// ─── ADMIN PROTECTION ────────────────────────────────────────
// Admin access is guarded client-side via admin.js requireAdmin()
// and all admin API endpoints use verifyToken + isAdmin middleware.

// ─── STATIC FILES (Frontend) ─────────────────────────────────
// Serve /uploads explicitly FIRST to prevent SPA fallback from hijacking images
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
// Serve other static files from /public
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
apiRouter.use('/auth', apiLimiter, authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/orders', apiLimiter, orderRoutes);
apiRouter.use('/settings', settingsRoutes);

apiRouter.use('/tickets', ticketRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/chat', messageRoutes);
apiRouter.use('/admin', adminRoutes);

// Admin Stats route — must be AFTER admin routes are mounted
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
      console.error('⚠️ WARNING: Failed to connect to MySQL database on boot. Endpoints will fail, but server will remain active.');
    }

    // Auto-create necessary folders
    const dirs = ['uploads', 'uploads/admin', 'qris', 'proofs', 'chat_files', 'avatars'];
    dirs.forEach(dir => {
      const p = path.join(__dirname, '..', 'public', dir);
      if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
        console.log(`   📂 Created directory: public/${dir}`);
      }
    });

    // Initialize database tables ONLY if DB is connected
    if (dbOk) {
      await initializeDatabase();
    }

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
    console.error('❌ Failed to start server gracefully, running in degraded mode:', error);
    // Degraded fallback listening if something threw unexpected
    app.listen(PORT, () => {
      console.log(`⚠️ RUNNING IN DEGRADED 503-FALLBACK MODE ON PORT ${PORT}`);
    });
  }
}

startServer();

export default app;
