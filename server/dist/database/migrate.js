"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_service_1 = require("./database.service");
async function run() {
    const db = new database_service_1.DatabaseService();
    db.onModuleInit();
    try {
        console.log('[MIGRATION] Running database migrations...');
        await db.runMigrations();
        console.log('[MIGRATION] All migrations applied successfully.');
    }
    catch (error) {
        console.error('[MIGRATION_ERROR]', error.message);
        process.exit(1);
    }
    finally {
        await db.onModuleDestroy();
    }
}
if (require.main === module) {
    run();
}
//# sourceMappingURL=migrate.js.map