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
exports.testConnection = testConnection;
exports.initializeDatabase = initializeDatabase;
exports.generateUUID = generateUUID;
exports.generateOrderNumber = generateOrderNumber;
exports.generateTicketNumber = generateTicketNumber;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Absolute path agar .env selalu terbaca di cPanel/Phusion Passenger
dotenv.config({ path: path_1.default.resolve(__dirname, '..', '..', '.env') });
// ============================================================
// RGS STORE — MySQL Database Connection & Schema Initializer
// v3.1 — Includes: payment_methods, cs_tickets, reviews tables
// Real product seeder (7 products)
// ============================================================
// ─── CONNECTION POOL ──────────────────────────────────────────
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'tgevcisg_rgs_store', // SYNCED: cPanel DB Name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+07:00',
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};
const db = promise_1.default.createPool(poolConfig);
// ─── TEST CONNECTION ──────────────────────────────────────────
async function testConnection() {
    try {
        const connection = await db.getConnection();
        await connection.query('SELECT 1');
        connection.release();
        console.log('✅ MySQL Database Connected Successfully');
        console.log(`   📦 Database: ${process.env.DB_NAME || 'rgs_store'}`);
        console.log(`   🖥️  Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}`);
        return true;
    }
    catch (error) {
        console.error('❌ MySQL Connection Error:', error.message);
        return false;
    }
}
// ─── TABLE SCHEMAS ────────────────────────────────────────────
const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) DEFAULT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expiry TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
const CREATE_PRODUCTS_TABLE = `
  CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Lainnya',
    description TEXT DEFAULT NULL,
    price INT NOT NULL DEFAULT 0,
    discount INT NOT NULL DEFAULT 0,
    final_price INT NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500) DEFAULT '',
    variants TEXT DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_products_category (category),
    INDEX idx_products_active (is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
const CREATE_ORDERS_TABLE = `
  CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_whatsapp VARCHAR(50) DEFAULT NULL,
    product_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    unit_price INT NOT NULL DEFAULT 0,
    total_price INT NOT NULL DEFAULT 0,
    payment_method VARCHAR(100) NOT NULL DEFAULT 'Transfer Bank',
    payment_proof VARCHAR(500) DEFAULT NULL,
    status ENUM('pending', 'waiting_confirmation', 'processing', 'shipped', 'success', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    credentials TEXT DEFAULT NULL,
    shipped_at TIMESTAMP NULL DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_product (product_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_number (order_number),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
const CREATE_PAYMENT_METHODS_TABLE = `
  CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('ewallet', 'bank', 'qris', 'other') NOT NULL DEFAULT 'ewallet',
    account_number VARCHAR(100) DEFAULT NULL,
    account_name VARCHAR(255) DEFAULT NULL,
    logo_url VARCHAR(500) DEFAULT NULL,
    qris_image_url VARCHAR(500) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
const CREATE_CS_TICKETS_TABLE = `
  CREATE TABLE IF NOT EXISTS cs_tickets (
    id VARCHAR(36) PRIMARY KEY,
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('open', 'replied', 'closed') NOT NULL DEFAULT 'open',
    admin_reply TEXT DEFAULT NULL,
    replied_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tickets_user (user_id),
    INDEX idx_tickets_status (status),
    CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
const CREATE_REVIEWS_TABLE = `
  CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    order_id VARCHAR(36) NOT NULL UNIQUE,
    rating INT NOT NULL DEFAULT 5,
    comment TEXT DEFAULT NULL,
    user_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reviews_product (product_id),
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
const CREATE_MESSAGES_TABLE = `
  CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    is_admin TINYINT(1) NOT NULL DEFAULT 0,
    message TEXT NOT NULL,
    file_url TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_messages_user (user_id),
    CONSTRAINT fk_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
// ─── DEFAULT SETTINGS ─────────────────────────────────────────
const INSERT_DEFAULT_SETTINGS = `
  INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
    ('site_name', 'RGS STORE'),
    ('site_description', 'Marketplace Digital Premium'),
    ('wa_admin', '62882016259591'),
    ('discord_url', 'https://discord.gg/huWJNZ4m9'),
    ('currency', 'IDR'),
    ('maintenance_mode', 'false');
`;
// ─── DEFAULT PAYMENT METHODS ──────────────────────────────────
const INSERT_DEFAULT_PAYMENT_METHODS = `
  INSERT IGNORE INTO payment_methods (name, type, account_number, account_name) VALUES
    ('DANA', 'ewallet', '0882016259591', 'RGS STORE'),
    ('OVO', 'ewallet', '0882016259591', 'RGS STORE'),
    ('QRIS', 'qris', NULL, 'RGS STORE');
`;
// ─── INITIALIZE DATABASE ──────────────────────────────────────
async function initializeDatabase() {
    try {
        console.log('📋 Initializing database tables...');
        await db.query(CREATE_USERS_TABLE);
        console.log('   ✓ Table "users" ready');
        await db.query(CREATE_PRODUCTS_TABLE);
        console.log('   ✓ Table "products" ready');
        await db.query(CREATE_ORDERS_TABLE);
        console.log('   ✓ Table "orders" ready');
        await db.query(CREATE_PAYMENT_METHODS_TABLE);
        console.log('   ✓ Table "payment_methods" ready');
        await db.query(CREATE_CS_TICKETS_TABLE);
        console.log('   ✓ Table "cs_tickets" ready');
        await db.query(CREATE_REVIEWS_TABLE);
        console.log('   ✓ Table "reviews" ready');
        await db.query(CREATE_SETTINGS_TABLE);
        console.log('   ✓ Table "settings" ready');
        await db.query(CREATE_MESSAGES_TABLE);
        console.log('   ✓ Table "messages" ready');
        // ─── ADD INDEXES (For Existing Tables) ─────────────────────
        try {
            await db.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
            await db.query('CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)');
            await db.query('CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)');
            console.log('   ✓ Production indices verified/added');
        }
        catch (e) {
            // Index already exists, skip
        }
        // Insert default data
        await db.query(INSERT_DEFAULT_SETTINGS);
        console.log('   ✓ Default settings loaded');
        await db.query(INSERT_DEFAULT_PAYMENT_METHODS);
        console.log('   ✓ Default payment methods loaded (DANA, OVO, QRIS)');
        // AUTO-SEEDER DISABLED per User Request
        console.log('   ℹ️  Auto-seeder disabled. Handle products manually via Admin.');
        // Check/create default admin
        const [adminRows] = await db.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
        if (adminRows.length === 0) {
            const bcrypt = require('bcrypt');
            const adminId = generateUUID();
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.query('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [adminId, 'Admin RGS', 'admin@rgsstore.com', hashedPassword, 'admin']);
            console.log('   ✓ Default admin created (admin@rgsstore.com / admin123)');
            console.log('   ⚠️  GANTI PASSWORD ADMIN DI PRODUCTION!');
        }
        console.log('✅ Database initialization complete');
        console.log('');
    }
    catch (error) {
        console.error('❌ Database initialization error:', error.message);
        throw error;
    }
}
// ─── UUID GENERATOR ───────────────────────────────────────────
function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
// ─── ORDER NUMBER GENERATOR ───────────────────────────────────
function generateOrderNumber() {
    const ts = Date.now().toString().slice(-6);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `INV-RGS-${ts}-${rand}`;
}
// ─── TICKET NUMBER GENERATOR ──────────────────────────────────
function generateTicketNumber() {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(100 + Math.random() * 900);
    return `TKT${y}${m}${rand}`;
}
exports.default = db;
//# sourceMappingURL=database.js.map