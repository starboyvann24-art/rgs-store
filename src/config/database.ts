import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';

// Absolute path agar .env selalu terbaca di cPanel
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// ============================================================
// RGS STORE — MySQL Database Connection & Schema Initializer
// Production-ready connection pool with auto table creation
// ============================================================

// ─── CONNECTION POOL ──────────────────────────────────────────
const poolConfig: PoolOptions = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rgs_store',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+07:00',
  // Reconnect automatically on connection loss
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

const db: Pool = mysql.createPool(poolConfig);

// ─── TEST CONNECTION ──────────────────────────────────────────
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await db.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    console.log('✅ MySQL Database Connected Successfully');
    console.log(`   📦 Database: ${process.env.DB_NAME || 'rgs_store'}`);
    console.log(`   🖥️  Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}`);
    return true;
  } catch (error: any) {
    console.error('❌ MySQL Connection Error:', error.message);
    return false;
  }
}

// ─── TABLE SCHEMAS ────────────────────────────────────────────
// All tables use InnoDB engine for foreign key support
// id fields use VARCHAR(36) for UUID compatibility

const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) DEFAULT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
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
    status ENUM('pending', 'processing', 'success', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
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

const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

// ─── INITIALIZE DATABASE ──────────────────────────────────────
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('📋 Initializing database tables...');

    // Create tables in order (respecting foreign key dependencies)
    await db.query(CREATE_USERS_TABLE);
    console.log('   ✓ Table "users" ready');

    await db.query(CREATE_PRODUCTS_TABLE);
    console.log('   ✓ Table "products" ready');

    await db.query(CREATE_ORDERS_TABLE);
    console.log('   ✓ Table "orders" ready');

    await db.query(CREATE_SETTINGS_TABLE);
    console.log('   ✓ Table "settings" ready');

    // Insert default settings (IGNORE = skip if already exists)
    await db.query(INSERT_DEFAULT_SETTINGS);
    console.log('   ✓ Default settings loaded');

    // Check if admin exists, if not create default admin
    const [adminRows] = await db.query<any>(
      'SELECT id FROM users WHERE role = ? LIMIT 1',
      ['admin']
    );

    if (adminRows.length === 0) {
      const bcrypt = require('bcrypt');
      const adminId = generateUUID();
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await db.query(
        'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [adminId, 'Admin RGS', 'admin@rgsstore.com', hashedPassword, 'admin']
      );
      console.log('   ✓ Default admin created (admin@rgsstore.com / admin123)');
      console.log('   ⚠️  CHANGE THE DEFAULT ADMIN PASSWORD IN PRODUCTION!');
    }

    console.log('✅ Database initialization complete');
    console.log('');
  } catch (error: any) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
}

// ─── UUID GENERATOR ───────────────────────────────────────────
export function generateUUID(): string {
  // crypto.randomUUID is available in Node 19+
  // Fallback for older Node versions on cPanel
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Manual UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── ORDER NUMBER GENERATOR ───────────────────────────────────
export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RGS${y}${m}${d}${rand}`;
}

export default db;
