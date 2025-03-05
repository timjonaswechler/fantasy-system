const path = require('path');
const { generateSlug, recordExists, logger } = require('../db-utils');

// Sample materials data - nur einige Beispiele, Rest im Originalskript
const sampleMaterials = [
    // METALLE
    {
        material_id: "iron",
        name: "Iron",
        description: "A common and versatile metal, known for its strength and durability.",
        category: "METAL",
        density: 7874,
        melting_point: 1538,
        boiling_point: 2862,
        ignite_point: null,
        impact_yield: 210,
        impact_fracture: 350,
        shear_yield: 130,
        shear_fracture: 250,
        hardness: 65,
        sharpness: 40,
        durability: 70,
        color: "Silver-Gray",
        color_hex: "#8C8C8C",
        is_magical: false,
        is_rare: false,
        value_modifier: 1.0,
        source_location: "Iron mines, mountains",
        source_creature: null,
        source_plant: null,
        states: [
            { state_name: "SOLID", state_description: "Solid iron", state_color: "#8C8C8C" },
            { state_name: "LIQUID", state_description: "Molten iron", state_color: "#FF5733" }
        ],
        properties: [
            { property_name: "Magnetic", property_value: "Yes" },
            { property_name: "Corrosion Resistance", property_value: "Low" }
        ]
    },
    // ... other materials from the original seed-materials.js file
    {
        material_id: "steel",
        name: "Steel",
        description: "An alloy of iron and carbon, stronger and more durable than iron.",
        category: "METAL",
        density: 7850,
        melting_point: 1450,
        boiling_point: 3000,
        ignite_point: null,
        impact_yield: 350,
        impact_fracture: 550,
        shear_yield: 200,
        shear_fracture: 420,
        hardness: 80,
        sharpness: 70,
        durability: 85,
        color: "Dark Gray",
        color_hex: "#5A5A5A",
        is_magical: false,
        is_rare: false,
        value_modifier: 2.5,
        source_location: "Forges, smithies",
        source_creature: null,
        source_plant: null,
        states: [
            { state_name: "SOLID", state_description: "Solid steel", state_color: "#5A5A5A" },
            { state_name: "LIQUID", state_description: "Molten steel", state_color: "#FF4500" }
        ],
        properties: [
            { property_name: "Magnetic", property_value: "Yes" },
            { property_name: "Corrosion Resistance", property_value: "Medium" }
        ]
    },
    {
        material_id: "gold",
        name: "Gold",
        description: "A precious metal prized for its beauty and rarity.",
        category: "METAL",
        // ...existing code...
    },
    {
        material_id: "granite",
        name: "Granite",
        description: "A hard, durable igneous rock commonly used in construction.",
        category: "STONE",
        // ...existing code...
    },
    {
        material_id: "obsidian",
        name: "Obsidian",
        description: "A naturally occurring volcanic glass, extremely sharp when broken.",
        category: "STONE",
        // ...existing code...
    },
    {
        material_id: "oak",
        name: "Oak Wood",
        description: "A sturdy hardwood known for its strength and durability.",
        category: "WOOD",
        // ...existing code...
    },
    {
        material_id: "leather",
        name: "Leather",
        description: "Treated animal hide used for clothing, armor, and various goods.",
        category: "LEATHER",
        // ...existing code...
    },
    {
        material_id: "diamond",
        name: "Diamond",
        description: "The hardest known natural material, prized for its beauty and rarity.",
        category: "GEM",
        // ...existing code...
    },
    {
        material_id: "arcane-crystal",
        name: "Arcane Crystal",
        description: "A crystalline material that resonates with magical energy.",
        category: "MAGICAL",
        // ...existing code...
    },
    // Add additional materials for transformations
    {
        material_id: "raw-hide",
        name: "Raw Hide",
        description: "Untreated animal hide, often used as a base material for leather.",
        category: "LEATHER",
        density: 950,
        melting_point: null,
        boiling_point: null,
        ignite_point: 200,
        impact_yield: 50,
        impact_fracture: 100,
        shear_yield: 30,
        shear_fracture: 60,
        hardness: 20,
        sharpness: 10,
        durability: 40,
        color: "Brown",
        color_hex: "#8B4513",
        is_magical: false,
        is_rare: false,
        value_modifier: 0.5,
        source_location: "Hunting grounds, farms",
        source_creature: "Various animals",
        source_plant: null,
        states: [
            { state_name: "SOLID", state_description: "Solid raw hide", state_color: "#8B4513" }
        ],
        properties: [
            { property_name: "Flexibility", property_value: "Medium" },
            { property_name: "Water Resistance", property_value: "Low" }
        ]
    }
];

// Seeder-Funktion für Materialien
async function seedMaterials(pool) {
    logger.header("Seeding Materials");
    let successCount = 0;
    let skippedCount = 0;
    let failureCount = 0;

    for (const material of sampleMaterials) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Prüfe, ob Material bereits existiert
            const exists = await recordExists(client, 'materials', 'material_id', material.material_id);
            if (exists) {
                skippedCount++;
                logger.info(`Material ${material.name} bereits vorhanden, überspringe...`);
                await client.query('ROLLBACK');
                continue;
            }

            // Haupteintrag des Materials
            const materialResult = await client.query(
                `INSERT INTO materials (
                  material_id, name, description, category, 
                  density, melting_point, boiling_point, ignite_point,
                  impact_yield, impact_fracture, shear_yield, shear_fracture,
                  hardness, sharpness, durability,
                  color, color_hex, is_magical, is_rare, value_modifier,
                  source_location, source_creature, source_plant
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
                RETURNING id`,
                [
                    material.material_id,
                    material.name,
                    material.description,
                    material.category,
                    material.density,
                    material.melting_point,
                    material.boiling_point,
                    material.ignite_point,
                    material.impact_yield,
                    material.impact_fracture,
                    material.shear_yield,
                    material.shear_fracture,
                    material.hardness,
                    material.sharpness,
                    material.durability,
                    material.color,
                    material.color_hex,
                    material.is_magical,
                    material.is_rare,
                    material.value_modifier,
                    material.source_location,
                    material.source_creature,
                    material.source_plant
                ]
            );

            const materialId = materialResult.rows[0].id;

            // Füge Zustände hinzu
            if (material.states && material.states.length > 0) {
                for (const state of material.states) {
                    await client.query(
                        `INSERT INTO material_states (material_id, state_name, state_description, state_color)
                        VALUES ($1, $2, $3, $4)`,
                        [materialId, state.state_name, state.state_description, state.state_color]
                    );
                }
            }

            // Füge Eigenschaften hinzu
            if (material.properties && material.properties.length > 0) {
                for (const prop of material.properties) {
                    await client.query(
                        `INSERT INTO material_properties (material_id, property_name, property_value)
                        VALUES ($1, $2, $3)`,
                        [materialId, prop.property_name, prop.property_value]
                    );
                }
            }

            await client.query('COMMIT');
            successCount++;
            logger.success(`Material hinzugefügt: ${material.name}`);
        } catch (error) {
            await client.query('ROLLBACK');
            failureCount++;
            logger.error(`Fehler beim Hinzufügen von Material ${material.name}: ${error.message}`);
        } finally {
            client.release();
        }
    }

    return {
        success: successCount,
        skipped: skippedCount,
        failed: failureCount,
        total: sampleMaterials.length
    };
}

module.exports = { seedMaterials };
