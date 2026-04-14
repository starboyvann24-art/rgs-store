import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';

// Absolute path agar .env selalu terbaca di cPanel/Phusion Passenger
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// ============================================================
// RGS STORE — MySQL Database Connection & Schema Initializer
// v3.1 — Includes: payment_methods, cs_tickets, reviews tables
// Real product seeder (7 products)
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
    status ENUM('pending', 'processing', 'shipped', 'success', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
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

// ─── REAL PRODUCT SEEDER ──────────────────────────────────────
// 7 produk digital real: Streaming, Discord, Hosting
const PRODUCTS_SEED = [
  {
    name: 'Netflix Premium 4K (1 Bulan)',
    category: 'Streaming',
    description: 'Akun Netflix Premium 4K Ultra HD. Dapat sampai 4 layar sekaligus. Garansi replace 1x24 jam jika bermasalah.',
    price: 42000,
    discount: 17,
    stock: 50,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg'
  },
  {
    name: 'Spotify Premium (1 Bulan)',
    category: 'Streaming',
    description: 'Spotify Premium tanpa iklan, download lagu offline, kualitas audio tinggi. Garansi replace 1x24 jam.',
    price: 22000,
    discount: 9,
    stock: 99,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg'
  },
  {
    name: 'YouTube Premium (1 Bulan)',
    category: 'Streaming',
    description: 'YouTube tanpa iklan, background play, download video offline. Share ke 5 anggota keluarga.',
    price: 18000,
    discount: 17,
    stock: 99,
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg'
  },
  {
    name: 'Discord Nitro Boost (1 Bulan)',
    category: 'Discord',
    description: 'Discord Nitro dengan 2 server boost, emoji custom di mana saja, avatar animasi, badge eksklusif.',
    price: 65000,
    discount: 8,
    stock: 30,
    image_url: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0b5061df29d55a92d945_full_logo_blurple_RGB.svg'
  },
  {
    name: 'Discord Nitro Basic (1 Bulan)',
    category: 'Discord',
    description: 'Discord Nitro Basic dengan emoji custom, avatar animasi, dan badge eksklusif tanpa server boost.',
    price: 32000,
    discount: 6,
    stock: 50,
    image_url: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0b5061df29d55a92d945_full_logo_blurple_RGB.svg'
  },
  {
    name: 'Panel Pterodactyl 4GB RAM',
    category: 'Hosting',
    description: '4GB RAM, 20GB SSD NVMe, 1 Gbps uplink. Cocok untuk Minecraft, bot Discord, web, atau game server.',
    price: 28000,
    discount: 11,
    stock: 20,
    image_url: 'https://pterodactyl.io/images/logo.png'
  },
  {
    name: 'Panel Pterodactyl 8GB RAM',
    category: 'Hosting',
    description: '8GB RAM, 50GB SSD NVMe, 1 Gbps uplink. Performa tinggi untuk server game atau aplikasi besar.',
    price: 50000,
    discount: 10,
    stock: 20,
    image_url: 'https://pterodactyl.io/images/logo.png'
  }
];

// ─── INITIALIZE DATABASE ──────────────────────────────────────
export async function initializeDatabase(): Promise<void> {
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

    // Insert default data
    await db.query(INSERT_DEFAULT_SETTINGS);
    console.log('   ✓ Default settings loaded');

    await db.query(INSERT_DEFAULT_PAYMENT_METHODS);
    console.log('   ✓ Default payment methods loaded (DANA, OVO, QRIS)');

    // Seed real products if none exist
    const [existingProducts] = await db.query<any>('SELECT COUNT(*) as count FROM products');
    if (existingProducts[0].count === 0) {
      const bcrypt = require('bcrypt');

      for (const p of PRODUCTS_SEED) {
        const pid = generateUUID();
        const finalPrice = Math.round(p.price * (1 - p.discount / 100));
        await db.query(
          `INSERT INTO products (id, name, category, description, price, discount, final_price, stock, image_url, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [pid, p.name, p.category, p.description, p.price, p.discount, finalPrice, p.stock, p.image_url]
        );
      }
      console.log(`   ✓ ${PRODUCTS_SEED.length} produk real berhasil di-seed`);
    } else {
      console.log('   ℹ️  Products already seeded, skipping.');
    }

    // Check/create default admin
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
      console.log('   ⚠️  GANTI PASSWORD ADMIN DI PRODUCTION!');
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
export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RGS${y}${m}${d}${rand}`;
}

// ─── TICKET NUMBER GENERATOR ──────────────────────────────────
export function generateTicketNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(100 + Math.random() * 900);
  return `TKT${y}${m}${rand}`;
}

export default db;
