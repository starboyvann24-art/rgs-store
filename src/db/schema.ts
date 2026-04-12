import { mysqlTable, text, longtext, varchar, int, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  whatsapp: varchar('whatsapp', { length: 50 }),
  role: mysqlEnum('role', ['user', 'admin']).default('user').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const products = mysqlTable('products', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  price: int('price').notNull(),
  discount: int('discount').default(0).notNull(),
  stock: int('stock').notNull(),
  variant: varchar('variant', { length: 100 }),
  description: text('description'),
  image_base64: longtext('image_base64'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const transactions = mysqlTable('transactions', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: varchar('user_id', { length: 36 }).references(() => users.id).notNull(),
  product_id: varchar('product_id', { length: 36 }).references(() => products.id).notNull(),
  qty: int('qty').notNull(),
  total_price: int('total_price').notNull(),
  payment_method: varchar('payment_method', { length: 100 }),
  status: mysqlEnum('status', ['pending', 'success', 'failed']).default('pending').notNull(),
  credential_data: text('credential_data'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
