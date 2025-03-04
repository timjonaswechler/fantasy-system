#!/usr/bin/env node

// scripts/seed-weapons.js
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configure PostgreSQL connection
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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

// Fix for category mismatch - make sure these exactly match your database enum values
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
    THROWABLE_ITEMS: "THROWABLE_ITEMS",
};

// Function to validate database enums exist
async function validateEnums() {
    const client = await pool.connect();
    try {
        // Check if our enum types match what's in the database
        const weaponTypeEnum = await client.query(`
            SELECT enumlabel FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE typname = 'weapon_type'
        `);

        const weaponCategoryEnum = await client.query(`
            SELECT enumlabel FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE typname = 'weapon_category'
        `);

        // Log the enum values from the database for debugging
        console.log("Database weapon_type values:", weaponTypeEnum.rows.map(row => row.enumlabel));
        console.log("Database weapon_category values:", weaponCategoryEnum.rows.map(row => row.enumlabel));

        // Update our WeaponCategory object to match database values
        if (weaponCategoryEnum.rows.length > 0) {
            const dbCategories = {};
            weaponCategoryEnum.rows.forEach(row => {
                dbCategories[row.enumlabel] = row.enumlabel;
            });

            // Override our WeaponCategory with database values
            Object.assign(WeaponCategory, dbCategories);
            console.log("Updated WeaponCategory to match database:", WeaponCategory);
        }

        return true;
    } catch (error) {
        console.error("Error validating enums:", error);
        return false;
    } finally {
        client.release();
    }
}

// Load JSON data
function loadJsonFile(filePath) {
    try {
        const fullPath = path.join(__dirname, '..', 'src', 'data', 'seed', 'weapons', filePath);
        const data = fs.readFileSync(fullPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading JSON file ${filePath}:`, error);
        return [];
    }
}

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

// Generate a unique weapon_id based on name (slug format)
function generateWeaponId(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Check if a weapon already exists in the database
async function weaponExists(client, weaponId) {
    const result = await client.query(
        'SELECT id FROM weapons WHERE weapon_id = $1',
        [weaponId]
    );
    return result.rows.length > 0;
}

// Seed a single weapon to the database
async function seedWeapon(client, weapon) {
    try {
        // Generate weapon_id
        const weaponId = generateWeaponId(weapon.name);

        // Check if weapon already exists
        const exists = await weaponExists(client, weaponId);
        if (exists) {
            // console.log(`Weapon ${weapon.name} already exists, skipping...`);
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
        // console.error(`Error seeding weapon ${weapon.name}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function main() {
    // First validate our enum values against the database
    const enumsValid = await validateEnums();
    if (!enumsValid) {
        console.error("ERROR: Database enums don't match expected values. Please check your migrations.");
        process.exit(1);
    }

    // Load all weapon JSON files
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
        // 'throwing_weapons.json'
    ];
    // Execute the main function
    // Combine all weapon data
    const allWeaponsData = [];
    for (const file of weaponFiles) {
        const data = loadJsonFile(file);
        const converted = convertWeaponData(data);
        allWeaponsData.push(...converted);
        console.log(`Loaded ${converted.length} weapons from ${file}`);
    }

    console.log(`Found ${allWeaponsData.length} weapons to seed`);
    console.log("Starting weapons seeding process...");

    // Process each weapon separately to avoid losing everything on error
    let successCount = 0;
    let failureCount = 0;
    let skipCount = 0;

    for (const weapon of allWeaponsData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await seedWeapon(client, weapon);

            if (result.success) {
                await client.query('COMMIT');
                if (result.skipped) {
                    skipCount++;
                    console.log(`⏭️ Skipped existing weapon: ${weapon.name}`);
                } else {
                    successCount++;
                    console.log(`✅ Successfully seeded weapon: ${weapon.name} (${result.id})`);
                }
            } else {
                await client.query('ROLLBACK');
                failureCount++;
                console.error(`❌ Failed to seed weapon ${weapon.name}: ${result.error}`);
            }
        } catch (error) {
            await client.query('ROLLBACK');
            failureCount++;
            console.error(`❌ Error processing weapon ${weapon.name}: ${error.message}`);
        } finally {
            client.release();
        }
    }

    console.log(`\nSeeding completed: ${successCount} successful, ${skipCount} skipped, ${failureCount} failed`);
    console.log(`Total weapons attempted: ${allWeaponsData.length}`);

    await pool.end();
}

// Execute the main function
main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});