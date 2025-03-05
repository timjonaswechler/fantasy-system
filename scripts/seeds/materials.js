// scripts/seeds/materials.js
const path = require('path');
const { loadJsonFile, generateSlug, recordExists, logger } = require('../db-utils');

// Seed-Funktion für ein einzelnes Material
async function seedMaterial(client, material) {
    try {
        // Material-ID aus dem Namen oder der bereitgestellten ID generieren
        const materialId = material.id || generateSlug(material.name);

        // Prüfen, ob das Material bereits existiert
        const exists = await recordExists(client, 'materials', 'material_id', materialId);
        if (exists) {
            return { success: true, id: materialId, skipped: true };
        }

        // Material in die Datenbank einfügen
        const result = await client.query(`
            INSERT INTO materials (
                material_id, name, category, description, density, 
                value_modifier, impact_yield, impact_fracture, impact_strain_at_yield,
                shear_yield, shear_fracture, shear_strain_at_yield,
                melting_point, boiling_point, ignite_point, specific_heat,
                display_color, is_metal, is_stone, is_gem, is_organic, is_fabric
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
                $14, $15, $16, $17, $18, $19, $20, $21, $22
            ) RETURNING id
        `, [
            materialId,
            material.name,
            material.category,
            material.description || "",
            material.density || 0,
            material.valueModifier || 1.0,
            material.impactYield || 0,
            material.impactFracture || 0,
            material.impactStrainAtYield || 0,
            material.shearYield || 0,
            material.shearFracture || 0,
            material.shearStrainAtYield || 0,
            material.meltingPoint || null,
            material.boilingPoint || null,
            material.ignitePoint || null,
            material.specificHeat || null,
            material.displayColor || "#CCCCCC",
            material.isMetal || false,
            material.isStone || false,
            material.isGem || false,
            material.isOrganic || false,
            material.isFabric || false
        ]);

        const materialDbId = result.rows[0].id;

        // Zusätzliche Eigenschaften einfügen, falls vorhanden
        if (material.additionalProperties && typeof material.additionalProperties === 'object') {
            for (const [key, value] of Object.entries(material.additionalProperties)) {
                const valueType = typeof value;
                await client.query(`
                    INSERT INTO material_properties (material_id, key, value, value_type)
                    VALUES ($1, $2, $3, $4)
                `, [materialDbId, key, String(value), valueType]);
            }
        }

        return { success: true, id: materialId };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Alle Material-Dateien laden und seeden
function loadAllMaterialData() {
    const materialFiles = [
        'metals.json',
        // Hier weitere Materialdateien hinzufügen, wenn sie erstellt wurden
        // 'woods.json',
        // 'stones.json',
        // 'fabrics.json',
        // usw.
    ];

    const allMaterialsData = [];
    for (const file of materialFiles) {
        const filePath = path.join(__dirname, '..', '..', 'src', 'db', 'seed', 'materials', file);
        const data = loadJsonFile(filePath);
        allMaterialsData.push(...data);
        logger.info(`Loaded ${data.length} materials from ${file}`);
    }

    return allMaterialsData;
}

// Hauptfunktion zum Seeden der Materialien
async function seedMaterials(pool) {
    const allMaterialsData = loadAllMaterialData();
    logger.info(`Found ${allMaterialsData.length} materials to seed`);

    let successCount = 0;
    let skippedCount = 0;
    let failureCount = 0;

    for (const material of allMaterialsData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await seedMaterial(client, material);

            if (result.success) {
                await client.query('COMMIT');
                if (result.skipped) {
                    skippedCount++;
                } else {
                    successCount++;
                    logger.success(`Seeded material: ${material.name}`);
                }
            } else {
                await client.query('ROLLBACK');
                failureCount++;
                logger.error(`Failed to seed material ${material.name}: ${result.error}`);
            }
        } catch (error) {
            await client.query('ROLLBACK');
            failureCount++;
            logger.error(`Error processing material ${material.name}: ${error.message}`);
        } finally {
            client.release();
        }
    }

    return {
        success: successCount,
        skipped: skippedCount,
        failed: failureCount,
        total: allMaterialsData.length
    };
}

module.exports = { seedMaterials };