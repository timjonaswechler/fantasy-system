const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Lade Umgebungsvariablen
dotenv.config();

// Erstelle einen Datenbankverbindungspool
function createDbPool() {
    const poolConfig = {
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT || "5432"),
        database: process.env.POSTGRES_DATABASE,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };

    // Füge Passwort nur hinzu, wenn gesetzt
    if (process.env.POSTGRES_PASSWORD && process.env.POSTGRES_PASSWORD.trim() !== "") {
        poolConfig.password = process.env.POSTGRES_PASSWORD;
    }

    return new Pool(poolConfig);
}

// Erstelle Migrations-Tabelle, falls sie nicht existiert
async function ensureMigrationsTable(pool) {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        logger.info('Migrations-Tabelle geprüft/erstellt');
    } catch (error) {
        logger.error(`Fehler beim Erstellen der Migrations-Tabelle: ${error.message}`);
        throw error;
    }
}

// Hole Liste der bereits angewendeten Migrationen
async function getAppliedMigrations(pool) {
    try {
        const result = await pool.query('SELECT name FROM migrations ORDER BY id');
        return result.rows.map(row => row.name);
    } catch (error) {
        logger.error(`Fehler beim Abrufen der angewendeten Migrationen: ${error.message}`);
        throw error;
    }
}

// Generiere eine ID-Slug aus einem Namen
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Lade JSON-Daten aus einer Datei
function loadJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        logger.error(`Fehler beim Laden der JSON-Datei ${filePath}: ${error.message}`);
        return [];
    }
}

// Hole alle Migrationsdateien aus dem Migrationsverzeichnis
function getMigrationFiles() {
    const migrationsDir = path.join(__dirname, '..', 'src', 'db', 'migrations');
    return fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
}

// Prüfe, ob ein Datensatz in einer Tabelle mit einer bestimmten Bedingung existiert
async function recordExists(pool, table, column, value) {
    const result = await pool.query(
        `SELECT 1 FROM ${table} WHERE ${column} = $1 LIMIT 1`,
        [value]
    );
    return result.rows.length > 0;
}

// Hilfsmittel für Konsolen-Logging mit Farben
const logger = {
    info: (msg) => console.log(`ℹ️ ${msg}`),
    success: (msg) => console.log(`✅ ${msg}`),
    warn: (msg) => console.log(`⚠️ ${msg}`),
    error: (msg) => console.error(`❌ ${msg}`),
    header: (msg) => console.log(`\n==== ${msg.toUpperCase()} ====`)
};

// Exportiere alle Utility-Funktionen
module.exports = {
    createDbPool,
    ensureMigrationsTable,
    getAppliedMigrations,
    getMigrationFiles,
    generateSlug,
    loadJsonFile,
    recordExists,
    logger
};
