#!/usr/bin/env node
const path = require('path');
const { createDbPool, logger } = require('./db-utils');
const { seedWeapons } = require('./seeds/weapons');
const { seedMaterials } = require('./seeds/materials');


// Hauptfunktion zum Seeden
async function seed(options = {}) {
    const pool = createDbPool();
    const { weapons = true, materials = true, transformations = true } = options;

    try {
        logger.header("Database Seeding");
        let successCount = 0;
        let skipCount = 0;
        let failCount = 0;

        // Zuerst Materialien seeden, da Waffen und Transformationen davon abhängen
        if (materials) {
            logger.info("Seeding materials...");
            const materialStats = await seedMaterials(pool);
            logger.info(`Materialien: ${materialStats.success} hinzugefügt, ${materialStats.skipped} übersprungen, ${materialStats.failed} fehlgeschlagen`);
            successCount += materialStats.success;
            skipCount += materialStats.skipped;
            failCount += materialStats.failed;
        }

        // Dann Waffen seeden
        if (weapons) {
            logger.info("Seeding weapons...");
            const weaponStats = await seedWeapons(pool);
            logger.info(`Waffen: ${weaponStats.success} hinzugefügt, ${weaponStats.skipped} übersprungen, ${weaponStats.failed} fehlgeschlagen`);
            successCount += weaponStats.success;
            skipCount += weaponStats.skipped;
            failCount += weaponStats.failed;
        }

        logger.success(`Seeding abgeschlossen: ${successCount} Datensätze hinzugefügt, ${skipCount} übersprungen, ${failCount} fehlgeschlagen`);
        return { success: successCount, skipped: skipCount, failed: failCount };
    } catch (error) {
        logger.error(`Seeding fehlgeschlagen: ${error.message}`);
        throw error;
    } finally {
        await pool.end();
    }
}

// Spezifische Kategorie von Seeds ausführen basierend auf Kommandozeilenargumenten
async function runSelectedSeeds() {
    const args = process.argv.slice(2);

    // Default - führe alle Seeds aus, wenn keine Argumente
    if (args.length === 0) {
        return seed();
    }

    const options = {
        weapons: args.includes('weapons'),
        materials: args.includes('materials'),
        transformations: args.includes('transformations')
    };

    return seed(options);
}

// Führe das Skript aus, wenn direkt aufgerufen
if (require.main === module) {
    runSelectedSeeds().catch(error => {
        logger.error(`Unbehandelter Fehler: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { seed };
