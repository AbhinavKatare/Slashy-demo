import { DatabaseService } from './database.service';

async function run() {
  const db = new DatabaseService();
  db.onModuleInit();
  try {
    console.log('[MIGRATION] Running database migrations...');
    await db.runMigrations();
    console.log('[MIGRATION] All migrations applied successfully.');
  } catch (error: any) {
    console.error('[MIGRATION_ERROR]', error.message);
    process.exit(1);
  } finally {
    await db.onModuleDestroy();
  }
}

if (require.main === module) {
  run();
}
