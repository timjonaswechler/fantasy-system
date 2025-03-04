// src/scripts/seed-transformations.js
const { Pool } = require('pg');
require("dotenv").config();

// Configure PostgreSQL connection
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Define transformation types and time units that match the database
const TransformationType = {
    SMELTING: 'SMELTING',
    ALLOYING: 'ALLOYING',
    TANNING: 'TANNING',
    CUTTING: 'CUTTING',
    GRINDING: 'GRINDING',
    CRAFTING: 'CRAFTING',
    MAGICAL: 'MAGICAL'
};

const TimeUnit = {
    MINUTES: 'MINUTES',
    HOURS: 'HOURS',
    DAYS: 'DAYS'
};

// Helper function to generate material ID from name
function generateMaterialId(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

// Check if a material exists in the database
async function getMaterialId(materialId) {
    try {
        const result = await pool.query(
            'SELECT id FROM materials WHERE material_id = $1',
            [materialId]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0].id;
    } catch (error) {
        console.error(`Error getting material ID for ${materialId}:`, error);
        return null;
    }
}

// Create a transformation
async function createTransformation(transformation) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get source material ID
        const sourceMaterialDbId = await getMaterialId(transformation.sourceMaterialId);
        if (!sourceMaterialDbId) {
            throw new Error(`Source material ${transformation.sourceMaterialId} not found in database`);
        }

        // Get target material ID
        const targetMaterialDbId = await getMaterialId(transformation.targetMaterialId);
        if (!targetMaterialDbId) {
            throw new Error(`Target material ${transformation.targetMaterialId} not found in database`);
        }

        // Check if transformation already exists
        const existingTransformation = await client.query(
            `SELECT id FROM material_transformations 
             WHERE source_material_id = $1 AND target_material_id = $2 AND transformation_type = $3`,
            [sourceMaterialDbId, targetMaterialDbId, transformation.type]
        );

        if (existingTransformation.rows.length > 0) {
            await client.query('ROLLBACK');
            return {
                success: false,
                error: `Transformation from ${transformation.sourceMaterialId} to ${transformation.targetMaterialId} already exists`
            };
        }

        // Insert the transformation
        const result = await client.query(
            `INSERT INTO material_transformations (
                source_material_id, target_material_id, transformation_type,
                process_description, required_temperature, yield_percentage,
                required_tool, processing_time, time_unit, additional_requirements
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING id`,
            [
                sourceMaterialDbId,
                targetMaterialDbId,
                transformation.type,
                transformation.description,
                transformation.requiredTemperature,
                transformation.yieldPercentage,
                transformation.requiredTool,
                transformation.processingTime,
                transformation.timeUnit,
                JSON.stringify(transformation.additionalRequirements || {})
            ]
        );

        await client.query('COMMIT');

        return {
            success: true,
            id: result.rows[0].id,
            message: `Created transformation from ${transformation.sourceMaterialId} to ${transformation.targetMaterialId}`
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating transformation:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

// Define sample transformations
const transformations = [
    // SMELTING transformations (ore to metal)
    {
        sourceMaterialId: generateMaterialId("Iron Ore"),
        targetMaterialId: generateMaterialId("Iron"),
        type: TransformationType.SMELTING,
        description: "Smelting iron ore in a furnace to produce iron ingots.",
        requiredTemperature: 1538,
        yieldPercentage: 85,
        requiredTool: "Furnace",
        processingTime: 2,
        timeUnit: TimeUnit.HOURS,
        additionalRequirements: {
            fuel: "Coal",
            fuelAmount: 5
        }
    },
    {
        sourceMaterialId: generateMaterialId("Gold Ore"),
        targetMaterialId: generateMaterialId("Gold"),
        type: TransformationType.SMELTING,
        description: "Smelting gold ore to produce pure gold.",
        requiredTemperature: 1064,
        yieldPercentage: 90,
        requiredTool: "Smelter",
        processingTime: 1,
        timeUnit: TimeUnit.HOURS,
        additionalRequirements: {
            flux: "Borax",
            fluxAmount: 2
        }
    },

    // ALLOYING transformations (metal combinations)
    {
        sourceMaterialId: generateMaterialId("Copper"),
        targetMaterialId: generateMaterialId("Bronze"),
        type: TransformationType.ALLOYING,
        description: "Combining copper with tin to create bronze alloy.",
        requiredTemperature: 950,
        yieldPercentage: 95,
        requiredTool: "Crucible",
        processingTime: 45,
        timeUnit: TimeUnit.MINUTES,
        additionalRequirements: {
            secondaryMaterial: "Tin",
            ratio: "9:1"
        }
    },
    {
        sourceMaterialId: generateMaterialId("Iron"),
        targetMaterialId: generateMaterialId("Steel"),
        type: TransformationType.ALLOYING,
        description: "Adding carbon to iron at high temperature to produce steel.",
        requiredTemperature: 1370,
        yieldPercentage: 90,
        requiredTool: "Blast Furnace",
        processingTime: 3,
        timeUnit: TimeUnit.HOURS,
        additionalRequirements: {
            secondaryMaterial: "Carbon",
            ratio: "99:1"
        }
    },

    // TANNING transformations (hide to leather)
    {
        sourceMaterialId: generateMaterialId("Raw Hide"),
        targetMaterialId: generateMaterialId("Leather"),
        type: TransformationType.TANNING,
        description: "Converting animal hide to usable leather through tanning process.",
        requiredTemperature: null,
        yieldPercentage: 80,
        requiredTool: "Tanning Rack",
        processingTime: 5,
        timeUnit: TimeUnit.DAYS,
        additionalRequirements: {
            tanningAgent: "Tree Bark",
            water: true
        }
    },

    // CUTTING transformations (wood processing)
    {
        sourceMaterialId: generateMaterialId("Oak Log"),
        targetMaterialId: generateMaterialId("Oak Plank"),
        type: TransformationType.CUTTING,
        description: "Cutting raw oak logs into usable planks.",
        requiredTemperature: null,
        yieldPercentage: 70,
        requiredTool: "Saw",
        processingTime: 30,
        timeUnit: TimeUnit.MINUTES,
        additionalRequirements: {}
    },

    // GRINDING transformations
    {
        sourceMaterialId: generateMaterialId("Wheat"),
        targetMaterialId: generateMaterialId("Flour"),
        type: TransformationType.GRINDING,
        description: "Grinding wheat into flour.",
        requiredTemperature: null,
        yieldPercentage: 95,
        requiredTool: "Mill",
        processingTime: 20,
        timeUnit: TimeUnit.MINUTES,
        additionalRequirements: {}
    },

    // CRAFTING transformations (general processing)
    {
        sourceMaterialId: generateMaterialId("Cotton"),
        targetMaterialId: generateMaterialId("Cloth"),
        type: TransformationType.CRAFTING,
        description: "Weaving cotton into cloth.",
        requiredTemperature: null,
        yieldPercentage: 90,
        requiredTool: "Loom",
        processingTime: 2,
        timeUnit: TimeUnit.HOURS,
        additionalRequirements: {
            skill: "Weaving"
        }
    },

    // MAGICAL transformations
    {
        sourceMaterialId: generateMaterialId("Quartz"),
        targetMaterialId: generateMaterialId("Arcane Crystal"),
        type: TransformationType.MAGICAL,
        description: "Infusing quartz with magical energy to create arcane crystals.",
        requiredTemperature: null,
        yieldPercentage: 50,
        requiredTool: "Enchanting Table",
        processingTime: 1,
        timeUnit: TimeUnit.DAYS,
        additionalRequirements: {
            manaRequired: 100,
            moonPhase: "Full Moon"
        }
    }
];

async function seedTransformations() {
    console.log("Starting transformations seeding process...");
    let successCount = 0;
    let failureCount = 0;
    let skipCount = 0;

    for (const transformation of transformations) {
        try {
            // Get material IDs to check if they exist
            const sourceMaterialExists = await getMaterialId(transformation.sourceMaterialId);
            const targetMaterialExists = await getMaterialId(transformation.targetMaterialId);

            if (!sourceMaterialExists) {
                console.warn(`⚠️ Source material ${transformation.sourceMaterialId} does not exist, skipping transformation`);
                skipCount++;
                continue;
            }

            if (!targetMaterialExists) {
                console.warn(`⚠️ Target material ${transformation.targetMaterialId} does not exist, skipping transformation`);
                skipCount++;
                continue;
            }

            const result = await createTransformation(transformation);

            if (result.success) {
                successCount++;
                console.log(`✅ Successfully created transformation: ${transformation.sourceMaterialId} → ${transformation.targetMaterialId}`);
            } else if (result.error && result.error.includes("already exists")) {
                skipCount++;
                console.log(`⏭️ Skipped existing transformation: ${transformation.sourceMaterialId} → ${transformation.targetMaterialId}`);
            } else {
                failureCount++;
                console.error(`❌ Failed to create transformation: ${result.error}`);
            }
        } catch (error) {
            failureCount++;
            console.error(`❌ Error creating transformation: ${error.message}`);
        }
    }

    console.log(`\nSeeding completed: ${successCount} successful, ${skipCount} skipped, ${failureCount} failed`);
    console.log(`Total transformations attempted: ${transformations.length}`);

    await pool.end();
}

// Execute the seeding function
seedTransformations().then(() => {
    console.log("Transformation seeding process finished.");
    process.exit(0);
}).catch(error => {
    console.error("Fatal error during transformation seeding:", error);
    process.exit(1);
});