import { testConnection, initializeDatabase } from '../config/database';

// ============================================================
// RGS STORE — Database Migration Script
// Run: npm run db:init
// Creates all tables and seeds default data
// ============================================================

async function migrate(): Promise<void> {
  console.log('');
  console.log('🔧 RGS STORE — Database Migration');
  console.log('══════════════════════════════════');
  console.log('');

  const connected = await testConnection();
  if (!connected) {
    console.error('');
    console.error('💡 Tips:');
    console.error('   1. Make sure MySQL server is running');
    console.error('   2. Check your .env file for correct DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('   3. Create the database first: CREATE DATABASE rgs_store;');
    console.error('');
    process.exit(1);
  }

  await initializeDatabase();

  console.log('');
  console.log('🎉 Migration complete! You can now run: npm run dev');
  console.log('');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
