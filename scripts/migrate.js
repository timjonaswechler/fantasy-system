#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const {
    createDbPool,
    ensureMigrationsTable,
    getAppliedMigrations,
    getMigrationFiles,
    logger
} = require('./db-utils');

// Run migrations
async function runMigrations() {
    const pool = createDbPool();

    try {
        logger.header("Database Migration");
        await ensureMigrationsTable(pool);
        const appliedMigrations = await getAppliedMigrations(pool);
        const migrationFiles = getMigrationFiles();

        logger.info(`Found ${migrationFiles.length} migration files`);
        logger.info(`Already applied: ${appliedMigrations.length} migrations`);

        // Count how many will be applied
        const pendingMigrations = migrationFiles.filter(file => !appliedMigrations.includes(file));
        logger.info(`Pending migrations: ${pendingMigrations.length}`);

        if (pendingMigrations.length === 0) {
            logger.success('Database is up to date, no migrations to apply');
            return;
        }

        // Apply migrations that haven't been applied yet
        const migrationsDir = path.join(__dirname, '..', 'src', 'db', 'migrations');

        for (const file of migrationFiles) {
            if (!appliedMigrations.includes(file)) {
                logger.info(`Applying migration: ${file}`);

                // Read migration file
                const migrationPath = path.join(migrationsDir, file);
                const migrationSql = fs.readFileSync(migrationPath, 'utf8');

                // Start a transaction
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    await client.query(migrationSql);
                    await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                    await client.query('COMMIT');
                    logger.success(`Migration ${file} applied successfully`);
                } catch (error) {
                    await client.query('ROLLBACK');
                    logger.error(`Error applying migration ${file}: ${error.message}`);
                    throw error;
                } finally {
                    client.release();
                }
            }
        }

        logger.success('All migrations completed successfully');
    } catch (error) {
        logger.error(`Migration failed: ${error.message}`);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the script if called directly
if (require.main === module) {
    runMigrations().catch(error => {
        logger.error(`Unhandled error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { runMigrations };