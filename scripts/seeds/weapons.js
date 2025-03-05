const path = require('path');
const fs = require('fs');
const { loadJsonFile, generateSlug, recordExists, logger } = require('../db-utils');

// Define enum types that match database values
const WeaponType = {
    MELEE: 'MELEE',
    RANGED: 'RANGED',
    THROWING: 'THROWING'
};

const GraspType = {
    ONE_HANDED: 'ONE_HANDED',
    TWO_HANDED: 'TWO_HANDED'
};

const WeaponCategory = {
    DAGGER: "DAGGER",
    SWORDS: "SWORDS",
    MACES: "MACES",
    SPEARS: "SPEARS",
    AXES: "AXES",
    FLAILS: "FLAILS",
    CLEAVERS: "CLEAVERS",
    HAMMERS: "HAMMERS",
    POLEARMS: "POLEARMS",
    BOWS: "BOWS",
    CROSSBOWS: "CROSSBOWS",
    FIREARMS: "FIREARMS",
    THROWING_WEAPONS: "THROWING_WEAPONS",
    THROWABLE_ITEMS: "THROWABLE_ITEMS",
};

// Convert range data format
function convertRangeData(rangeData) {
    if (!rangeData || !Array.isArray(rangeData) || rangeData.length === 0) {
        return undefined;
    }

    return rangeData.map(([precision, distance]) => ({
        precision,
        distance,
    }));
}

// Map JSON data to the format needed for database
function convertWeaponData(data) {
    return data.map((weapon) => ({
        name: weapon.name,
        description: weapon.description || "",
        type: weapon.type || WeaponType.MELEE,
        category: weapon.category === 'DAGGER' ? WeaponCategory.DAGGER : weapon.category,
        baseDamageMin: weapon.baseDamage ? weapon.baseDamage[0] : 0,
        baseDamageMax: weapon.baseDamage ? weapon.baseDamage[1] : 0,
        weightMin: weapon.weight ? weapon.weight[0] : 0,
        weightMax: weapon.weight ? weapon.weight[1] : 0,
        price: weapon.price || 0,
        material: weapon.material || "Stahl",
        durability: weapon.durability || 100,
        properties: weapon.properties || [],
        grasp: weapon.grasp ? weapon.grasp : [GraspType.ONE_HANDED],
        imageUrl: weapon.imageUrl || "",
        rangeData: convertRangeData(weapon.range),
    }));
}

// Function to validate database enums exist
async function validateEnums(pool) {
    try {
        // Check if our enum types match what's in the database
        const weaponTypeEnum = await pool.query(`
            SELECT enumlabel FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE typname = 'weapon_type'
        `);

        const weaponCategoryEnum = await pool.query(`
            SELECT enumlabel FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE typname = 'weapon_category'
        `);

        // Update our WeaponCategory object to match database values
        if (weaponCategoryEnum.rows.length > 0) {
            const dbCategories = {};
            weaponCategoryEnum.rows.forEach(row => {
                dbCategories[row.enumlabel] = row.enumlabel;
            });

            // Override our WeaponCategory with database values
            Object.assign(WeaponCategory, dbCategories);
        }

        return true;
    } catch (error) {
        logger.error(`Error validating enums: ${error.message}`);
        return false;
    }
}

// Seed a single weapon to the database
async function seedWeapon(client, weapon) {
    try {
        // Generate weapon_id
        const weaponId = generateSlug(weapon.name);

        // Check if weapon already exists
        const exists = await recordExists(client, 'weapons', 'weapon_id', weaponId);
        if (exists) {
            return { success: true, id: weaponId, skipped: true };
        }

        // Make sure properties is an array
        if (!Array.isArray(weapon.properties)) {
            weapon.properties = [];
        }

        // Insert weapon into database
        const result = await client.query(`
            INSERT INTO weapons (
                weapon_id, name, description, type, category,
                base_damage_min, base_damage_max, weight_min, weight_max,
                price, material, durability, properties, image_url
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            ) RETURNING id
        `, [
            weaponId,
            weapon.name,
            weapon.description,
            weapon.type,
            weapon.category,
            weapon.baseDamageMin,
            weapon.baseDamageMax,
            weapon.weightMin,
            weapon.weightMax,
            weapon.price,
            weapon.material,
            weapon.durability,
            weapon.properties,
            weapon.imageUrl || null
        ]);

        const weaponDbId = result.rows[0].id;

        // Insert grasp types
        if (weapon.grasp && weapon.grasp.length > 0) {
            for (const grasp of weapon.grasp) {
                await client.query(`
                    INSERT INTO weapon_grasp (weapon_id, grasp_type)
                    VALUES ($1, $2)
                `, [weaponDbId, grasp]);
            }
        }

        // Insert range data if provided
        if (weapon.rangeData && weapon.rangeData.length > 0) {
            for (const range of weapon.rangeData) {
                await client.query(`
                    INSERT INTO weapon_range (weapon_id, precision_value, distance)
                    VALUES ($1, $2, $3)
                `, [weaponDbId, range.precision, range.distance]);
            }
        }

        return { success: true, id: weaponId };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Load all weapon data from JSON files
function loadAllWeaponData() {
    const weaponFiles = [
        'axes.json',
        'bows.json',
        'cleavers.json',
        'crossbows.json',
        'daggers.json',
        'firearms.json',
        'flails.json',
        'hammers.json',
        'maces.json',
        'polearms.json',
        'spears.json',
        'swords.json',
        'throwables.json',
    ];

    const allWeaponsData = [];
    for (const file of weaponFiles) {
        const filePath = path.join(__dirname, '..', '..', 'src', 'data', 'seed', 'weapons', file);
        const data = loadJsonFile(filePath);
        const converted = convertWeaponData(data);
        allWeaponsData.push(...converted);
        logger.info(`Loaded ${converted.length} weapons from ${file}`);
    }

    return allWeaponsData;
}

// Main seeder function
async function seedWeapons(pool) {
    // First validate our enum values against the database
    const enumsValid = await validateEnums(pool);
    if (!enumsValid) {
        throw new Error("Database enums don't match expected values");
    }

    const allWeaponsData = loadAllWeaponData();
    logger.info(`Found ${allWeaponsData.length} weapons to seed`);

    let successCount = 0;
    let skippedCount = 0;
    let failureCount = 0;

    for (const weapon of allWeaponsData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await seedWeapon(client, weapon);

            if (result.success) {
                await client.query('COMMIT');
                if (result.skipped) {
                    skippedCount++;
                } else {
                    successCount++;
                    logger.success(`Seeded weapon: ${weapon.name}`);
                }
            } else {
                await client.query('ROLLBACK');
                failureCount++;
                logger.error(`Failed to seed weapon ${weapon.name}: ${result.error}`);
            }
        } catch (error) {
            await client.query('ROLLBACK');
            failureCount++;
            logger.error(`Error processing weapon ${weapon.name}: ${error.message}`);
        } finally {
            client.release();
        }
    }

    return {
        success: successCount,
        skipped: skippedCount,
        failed: failureCount,
        total: allWeaponsData.length
    };
}

module.exports = { seedWeapons };
