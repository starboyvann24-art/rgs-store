"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactions = exports.products = exports.users = exports.statusEnum = exports.roleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.roleEnum = (0, pg_core_1.pgEnum)('role', ['user', 'admin']);
exports.statusEnum = (0, pg_core_1.pgEnum)('status', ['pending', 'success', 'failed']);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    password: (0, pg_core_1.text)('password').notNull(),
    whatsapp: (0, pg_core_1.varchar)('whatsapp', { length: 50 }),
    role: (0, exports.roleEnum)('role').default('user').notNull(),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.products = (0, pg_core_1.pgTable)('products', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    category: (0, pg_core_1.varchar)('category', { length: 100 }),
    price: (0, pg_core_1.integer)('price').notNull(),
    discount: (0, pg_core_1.integer)('discount').default(0).notNull(),
    stock: (0, pg_core_1.integer)('stock').notNull(),
    variant: (0, pg_core_1.varchar)('variant', { length: 100 }),
    description: (0, pg_core_1.text)('description'),
    image_base64: (0, pg_core_1.text)('image_base64'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.transactions = (0, pg_core_1.pgTable)('transactions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    user_id: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    product_id: (0, pg_core_1.uuid)('product_id').references(() => exports.products.id).notNull(),
    qty: (0, pg_core_1.integer)('qty').notNull(),
    total_price: (0, pg_core_1.integer)('total_price').notNull(),
    payment_method: (0, pg_core_1.varchar)('payment_method', { length: 100 }),
    status: (0, exports.statusEnum)('status').default('pending').notNull(),
    credential_data: (0, pg_core_1.text)('credential_data'),
    created_at: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
