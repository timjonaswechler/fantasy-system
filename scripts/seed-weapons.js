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

const WeaponCategory = {
    //MELLEE
    DAGGERS: "DAGGERS",
    SWORDS: "SWORDS",
    MACES: "MACES",
    SPEARS: "SPEARS",
    AXES: "AXES",
    FLAILS: "FLAILS",
    CLEAVERS: "CLEAVERS",
    HAMMERS: "HAMMERS",
    POLEARMS: "POLEARMS",

    // RANGED
    BOWS: "BOWS",
    CROSSBOWS: "CROSSBOWS",
    FIREARMS: "FIREARMS",
    THROWING_WEAPONS: "THROWING_WEAPONS",
    THROWABLE_ITEMS: "THROWABLE_ITEMS",
};

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
        category: weapon.category,
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

// Seed a single weapon to the database
async function seedWeapon(client, weapon) {
    try {
        // Generate weapon_id
        const weaponId = generateWeaponId(weapon.name);

        // Validate the weapon type
        if (!Object.values(WeaponType).includes(weapon.type)) {
            throw new Error(`Invalid weapon type: ${weapon.type}`);
        }

        // Validate the weapon category
        if (!Object.values(WeaponCategory).includes(weapon.category)) {
            // Special case for daggers - there's a mismatch between the enum and the data
            if (weapon.category === 'DAGGER') {
                weapon.category = WeaponCategory.DAGGERS;
            } else {
                throw new Error(`Invalid weapon category: ${weapon.category}`);
            }
        }

        // Validate grasp types
        if (weapon.grasp && weapon.grasp.length > 0) {
            for (let i = 0; i < weapon.grasp.length; i++) {
                if (!Object.values(GraspType).includes(weapon.grasp[i])) {
                    throw new Error(`Invalid grasp type: ${weapon.grasp[i]}`);
                }
            }
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

        return weaponId;
    } catch (error) {
        throw error;
    }
}

async function main() {
    // Load all weapon JSON files
    const weaponDataSets = [
        loadJsonFile('axes.json'),
        loadJsonFile('bows.json'),
        loadJsonFile('cleavers.json'),
        loadJsonFile('crossbows.json'),
        loadJsonFile('daggers.json'),
        loadJsonFile('firearms.json'),
        loadJsonFile('flails.json'),
        loadJsonFile('hammers.json'),
        loadJsonFile('maces.json'),
        loadJsonFile('polearms.json'),
        loadJsonFile('spears.json'),
        loadJsonFile('swords.json'),
        loadJsonFile('throwables.json'),
        loadJsonFile('throwing_weapons.json')
    ];

    // Combine all weapon data
    const allWeaponsData = [];
    for (const dataSet of weaponDataSets) {
        allWeaponsData.push(...convertWeaponData(dataSet));
    }

    console.log(`Found ${allWeaponsData.length} weapons to seed`);

    // Process each weapon separately to avoid losing everything on error
    let successCount = 0;
    for (const weapon of allWeaponsData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const id = await seedWeapon(client, weapon);

            await client.query('COMMIT');
            console.log(`Seeded weapon: ${weapon.name} (${id})`);
            successCount++;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Failed to seed weapon ${weapon.name}:`, error.message);

            // Print more details about the weapon that failed
            console.error('Weapon details:', JSON.stringify({
                name: weapon.name,
                type: weapon.type,
                category: weapon.category,
                grasp: weapon.grasp
            }, null, 2));
        } finally {
            client.release();
        }
    }

    console.log(`Successfully seeded ${successCount}/${allWeaponsData.length} weapons.`);
    await pool.end();
}

// Execute the main function
main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});