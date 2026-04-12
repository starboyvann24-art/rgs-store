import { db } from './index';
import { users, products } from './schema';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

const seed = async () => {
  try {
    console.log('Seeding Database...');

    // Hash admin password
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Insert Admin
    const [adminUser] = await db.insert(users).values({
      name: 'Super Admin',
      email: 'admin@rgsstore.com',
      password: adminPassword,
      role: 'admin',
    }).returning();
    
    console.log(`Admin User Created: ${adminUser.email}`);

    // Insert Dummy Products
    const dummyProducts = [
      {
        name: 'Netflix Premium 1 Month',
        category: 'Digital Service',
        price: 50000,
        discount: 10,
        stock: 100,
        variant: '1 Month',
        description: 'Netflix Premium access for 1 month via Private Account.',
      },
      {
        name: 'Spotify Premium 1 Year',
        category: 'Digital Service',
        price: 300000,
        discount: 0,
        stock: 50,
        variant: '1 Year',
        description: 'Spotify Premium Individual for 1 year.',
      },
    ];

    for (const product of dummyProducts) {
      await db.insert(products).values(product);
    }
    console.log(`Dummy Products created successfully.`);

    console.log('Seeding Completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seed();
