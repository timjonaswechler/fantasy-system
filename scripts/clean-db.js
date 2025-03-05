#!/usr/bin/env node
const readline = require('readline');
const { createDbPool, logger } = require('./db-utils');

// Tabellen zum Säubern in der richtigen Reihenfolge (unter Berücksichtigung von Fremdschlüsselbeziehungen)
const TABLES = [
    'material_transformations',
    'composite_components',
    'composite_materials',
    'material_states',
    'material_properties',
    'weapon_materials',
    'weapon_range',
    'weapon_grasp',
    'weapons',
    'materials'
];

// Nach Bestätigung fragen, bevor fortgefahren wird
function confirm(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'j' || answer.toLowerCase() === 'ja' ||
                answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

// Datenbanktabellen säubern
async function cleanDatabase(options = {}) {
    const { confirmPrompt = true, tables = TABLES } = options;
    const pool = createDbPool();

    try {
        logger.header("Datenbank säubern");
        logger.warn("Dies löscht ALLE Daten aus den folgenden Tabellen:");
        tables.forEach(table => logger.warn(`- ${table}`));
        logger.info(`Datenbank: ${process.env.POSTGRES_DATABASE}`);

        let proceed = !confirmPrompt;

        if (!proceed) {
            proceed = await confirm("\nMöchten Sie fortfahren? (j/N): ");
        }

        if (!proceed) {
            logger.info("Vorgang abgebrochen");
            return { cancelled: true };
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const table of tables) {
                logger.info(`Lösche Tabelle: ${table}...`);
                await client.query(`DELETE FROM ${table}`);
                logger.success(`Tabelle ${table} geleert`);
            }

            await client.query('COMMIT');
            logger.success("Datenbanksäuberung erfolgreich abgeschlossen");
            return { success: true };
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`Fehler beim Säubern der Datenbank: ${error.message}`);
            return { success: false, error };
        } finally {
            client.release();
        }
    } finally {
        await pool.end();
    }
}

// Führe das Skript aus, wenn direkt aufgerufen
async function main() {
    const args = process.argv.slice(2);

    // Bereinige Datenbank
    await cleanDatabase({ confirmPrompt: !args.includes('--force') });
}

if (require.main === module) {
    main().catch(error => {
        logger.error(`Unbehandelter Fehler: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { cleanDatabase };
