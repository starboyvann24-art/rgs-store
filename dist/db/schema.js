"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactions = exports.products = exports.users = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
exports.users = (0, mysql_core_1.mysqlTable)('users', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: (0, mysql_core_1.varchar)('name', { length: 255 }).notNull(),
    email: (0, mysql_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    password: (0, mysql_core_1.text)('password').notNull(),
    whatsapp: (0, mysql_core_1.varchar)('whatsapp', { length: 50 }),
    role: (0, mysql_core_1.mysqlEnum)('role', ['user', 'admin']).default('user').notNull(),
    created_at: (0, mysql_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.products = (0, mysql_core_1.mysqlTable)('products', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: (0, mysql_core_1.varchar)('name', { length: 255 }).notNull(),
    category: (0, mysql_core_1.varchar)('category', { length: 100 }),
    price: (0, mysql_core_1.int)('price').notNull(),
    discount: (0, mysql_core_1.int)('discount').default(0).notNull(),
    stock: (0, mysql_core_1.int)('stock').notNull(),
    variant: (0, mysql_core_1.varchar)('variant', { length: 100 }),
    description: (0, mysql_core_1.text)('description'),
    image_base64: (0, mysql_core_1.longtext)('image_base64'),
    created_at: (0, mysql_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.transactions = (0, mysql_core_1.mysqlTable)('transactions', {
    id: (0, mysql_core_1.varchar)('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: (0, mysql_core_1.varchar)('user_id', { length: 36 }).references(() => exports.users.id).notNull(),
    product_id: (0, mysql_core_1.varchar)('product_id', { length: 36 }).references(() => exports.products.id).notNull(),
    qty: (0, mysql_core_1.int)('qty').notNull(),
    total_price: (0, mysql_core_1.int)('total_price').notNull(),
    payment_method: (0, mysql_core_1.varchar)('payment_method', { length: 100 }),
    status: (0, mysql_core_1.mysqlEnum)('status', ['pending', 'success', 'failed']).default('pending').notNull(),
    credential_data: (0, mysql_core_1.text)('credential_data'),
    created_at: (0, mysql_core_1.timestamp)('created_at').defaultNow().notNull(),
});
