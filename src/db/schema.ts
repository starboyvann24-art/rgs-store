import { pgTable, text, varchar, integer, timestamp, pgEnum, uuid } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['user', 'admin']);
export const statusEnum = pgEnum('status', ['pending', 'success', 'failed']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  whatsapp: varchar('whatsapp', { length: 50 }),
  role: roleEnum('role').default('user').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  price: integer('price').notNull(),
  discount: integer('discount').default(0).notNull(),
  stock: integer('stock').notNull(),
  variant: varchar('variant', { length: 100 }),
  description: text('description'),
  image_base64: text('image_base64'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  product_id: uuid('product_id').references(() => products.id).notNull(),
  qty: integer('qty').notNull(),
  total_price: integer('total_price').notNull(),
  payment_method: varchar('payment_method', { length: 100 }),
  status: statusEnum('status').default('pending').notNull(),
  credential_data: text('credential_data'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
