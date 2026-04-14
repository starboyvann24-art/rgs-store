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
const dotenv = __importStar(require("dotenv"));
// Load .env with absolute path — wajib agar terbaca di cPanel/Phusion Passenger
// __dirname di dist/server.js → naik 1 level → root project
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
const error_middleware_1 = require("./middleware/error.middleware");
const response_1 = require("./utils/response");
// ============================================================
// RGS STORE — Main Server (Node.js Monolithic for cPanel)
// Express serves both API and static frontend from /public
// ============================================================
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// ─── BODY PARSERS ─────────────────────────────────────────────
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ─── ADMIN PROTECTION (Before Static) ────────────────────────
// Protect /admin.html from unauthorized access
app.get(['/admin', '/admin.html'], auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, (req, res, next) => {
    next(); // Allow if admin
});
// Fallback for non-admin attempts (since static matches after)
app.use(['/admin', '/admin.html'], (req, res, next) => {
    // If we reach here without verifyToken/isAdmin passing, it's either unauth or non-admin
    res.redirect('/index.html');
});
// ─── STATIC FILES (Frontend) ─────────────────────────────────
// Serve all files from /public directory (HTML, CSS, JS, images)
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
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
apiRouter.use('/auth', auth_routes_1.default);
apiRouter.use('/products', product_routes_1.default);
apiRouter.use('/orders', order_routes_1.default);
apiRouter.use('/settings', settings_routes_1.default);
apiRouter.use('/tickets', ticket_routes_1.default);
apiRouter.use('/reviews', review_routes_1.default);
apiRouter.use('/payment-methods', payment_routes_1.default);
apiRouter.use('/messages', message_routes_1.default);
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
// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────
app.use(error_middleware_1.errorHandler);
// ─── START SERVER ─────────────────────────────────────────────
async function startServer() {
    try {
        // Test database connection
        const dbOk = await (0, database_1.testConnection)();
        if (!dbOk) {
            console.error('❌ Failed to connect to database. Check your .env configuration.');
            process.exit(1);
        }
        // Initialize database tables
        await (0, database_1.initializeDatabase)();
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
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map