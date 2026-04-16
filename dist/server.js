"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv = __importStar(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
// Load .env with absolute path — wajib agar terbaca di cPanel/Phusion Passenger
dotenv.config({ path: path_1.default.resolve(__dirname, '..', '.env') });
const database_1 = require("./config/database");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const ticket_routes_1 = __importDefault(require("./routes/ticket.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const response_1 = require("./utils/response");
// ============================================================
// RGS STORE — Main Server (Node.js Monolithic for cPanel)
// Express serves both API and static frontend from /public
// ============================================================
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// ─── SECURITY & PARSERS ───────────────────────────────────────
// Gunakan helmet tanpa memecah resource lokal
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 300, // Max 300 request per IP (agak longgar untuk aset statis)
    message: { success: false, message: 'Terlalu banyak permintaan, coba lagi nanti.' }
});
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000,
    max: 50, // Max 50 request API per IP tiap 5 menit
    message: { success: false, message: 'Too many API requests, please try again later.' }
});
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ─── SESSION & PASSPORT (for Google OAuth) ───────────────────
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || 'rgs_store_session_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// ─── ADMIN PROTECTION ────────────────────────────────────────
// Admin access is guarded client-side via admin.js requireAdmin()
// and all admin API endpoints use verifyToken + isAdmin middleware.
// ─── STATIC FILES (Frontend) ─────────────────────────────────
// Serve all files from /public directory (HTML, CSS, JS, images)
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
// Explicitly serve /uploads statically as failsafe for cPanel proxy routing
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'public', 'uploads')));
// ─── API ROUTES ───────────────────────────────────────────────
const apiRouter = express_1.default.Router();
// Health check endpoint
apiRouter.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'RGS STORE API is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});
// Mount route modules
apiRouter.use('/auth', apiLimiter, auth_routes_1.default);
apiRouter.use('/products', product_routes_1.default);
apiRouter.use('/orders', apiLimiter, order_routes_1.default);
apiRouter.use('/settings', settings_routes_1.default);
const order_controller_1 = require("./controllers/order.controller");
apiRouter.use('/tickets', ticket_routes_1.default);
apiRouter.use('/reviews', review_routes_1.default);
apiRouter.use('/payments', payment_routes_1.default);
apiRouter.use('/chat', message_routes_1.default);
// Fix API Admin Stats Routing explicitly as requested
apiRouter.get('/admin/stats', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, order_controller_1.getOrderStats);
// Register API router under /api
app.use('/api', apiRouter);
// ─── 404 HANDLER FOR API ROUTES ───────────────────────────────
// Only triggered if /api/* doesn't match anything in apiRouter
app.use('/api', (req, res) => {
    console.log(`⚠️  Rute nyasar (API 404): ${req.method} ${req.originalUrl}`);
    (0, response_1.sendResponse)(res, 404, false, `API endpoint not found: ${req.method} ${req.originalUrl}`);
});
// ─── SPA FALLBACK ─────────────────────────────────────────────
// All non-API routes serve index.html (for frontend routing)
app.use((_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'public', 'index.html'));
});
// ─── GLOBAL ERROR HANDLER (HARDCODE FIX) ──────────────────────
app.use((err, req, res, next) => {
    console.error("CRITICAL SERVER ERROR:", err);
    res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
});
// ─── START SERVER ─────────────────────────────────────────────
async function startServer() {
    try {
        // Test database connection
        const dbOk = await (0, database_1.testConnection)();
        if (!dbOk) {
            console.error('⚠️ WARNING: Failed to connect to MySQL database on boot. Endpoints will fail, but server will remain active.');
        }
        // Auto-create necessary folders
        const dirs = ['uploads', 'qris', 'proofs', 'chat_files', 'avatars'];
        dirs.forEach(dir => {
            const p = path_1.default.join(__dirname, '..', 'public', dir);
            if (!fs_1.default.existsSync(p)) {
                fs_1.default.mkdirSync(p, { recursive: true });
                console.log(`   📂 Created directory: public/${dir}`);
            }
        });
        // Initialize database tables ONLY if DB is connected
        if (dbOk) {
            await (0, database_1.initializeDatabase)();
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
    }
    catch (error) {
        console.error('❌ Failed to start server gracefully, running in degraded mode:', error);
        // Degraded fallback listening if something threw unexpected
        app.listen(PORT, () => {
            console.log(`⚠️ RUNNING IN DEGRADED 503-FALLBACK MODE ON PORT ${PORT}`);
        });
    }
}
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map