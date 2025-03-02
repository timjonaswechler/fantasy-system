// src/scripts/run-migrations.ts
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Configure PostgreSQL connection
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Create migrations table if it doesn't exist
async function ensureMigrationsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Migrations table checked/created");
  } catch (error) {
    console.error("Error creating migrations table:", error);
    throw error;
  }
}

// Get list of already applied migrations
async function getAppliedMigrations() {
  try {
    const result = await pool.query("SELECT name FROM migrations ORDER BY id");
    return result.rows.map((row: { name: string }) => row.name);
  } catch (error) {
    console.error("Error getting applied migrations:", error);
    throw error;
  }
}

// Run migrations
async function runMigrations() {
  try {
    await ensureMigrationsTable();

    const appliedMigrations = await getAppliedMigrations();
    const migrationsDir = path.join(__dirname, "..", "db", "migrations");

    // Read all migration files
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file: string) => file.endsWith(".sql"))
      .sort(); // Ensure we run migrations in order

    console.log(`Found ${migrationFiles.length} migration files`);

    // Apply migrations that haven't been applied yet
    for (const file of migrationFiles) {
      if (!appliedMigrations.includes(file)) {
        console.log(`Applying migration: ${file}`);

        // Read migration file
        const migrationPath = path.join(migrationsDir, file);
        const migrationSql = fs.readFileSync(migrationPath, "utf8");

        // Start a transaction
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          // Run the migration
          await client.query(migrationSql);

          // Record the migration as applied
          await client.query("INSERT INTO migrations (name) VALUES ($1)", [
            file,
          ]);

          await client.query("COMMIT");
          console.log(`Migration ${file} applied successfully`);
        } catch (error) {
          await client.query("ROLLBACK");
          console.error(`Error applying migration ${file}:`, error);
          throw error;
        } finally {
          client.release();
        }
      } else {
        console.log(`Migration already applied: ${file}`);
      }
    }

    console.log("All migrations applied successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the script
runMigrations().catch(console.error);
