// scripts/seed-materials.js
const { Pool } = require('pg');
require('dotenv').config();

// Konfiguration für den PostgreSQL-Pool
const poolConfig = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    database: process.env.POSTGRES_DATABASE,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
};

// Passwort nur hinzufügen, wenn es gesetzt ist
if (process.env.POSTGRES_PASSWORD && process.env.POSTGRES_PASSWORD.trim() !== "") {
    poolConfig.password = process.env.POSTGRES_PASSWORD;
}

// Pool erstellen
const pool = new Pool(poolConfig);

// Beispieldaten für Materialien
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
        density: 19300,
        melting_point: 1064,
        boiling_point: 2856,
        ignite_point: null,
        impact_yield: 120,
        impact_fracture: 220,
        shear_yield: 70,
        shear_fracture: 180,
        hardness: 30,
        sharpness: 10,
        durability: 40,
        color: "Yellow-Gold",
        color_hex: "#FFD700",
        is_magical: false,
        is_rare: true,
        value_modifier: 50.0,
        source_location: "Gold mines, riverbeds",
        source_creature: null,
        source_plant: null,
        states: [
            { state_name: "SOLID", state_description: "Solid gold", state_color: "#FFD700" },
            { state_name: "LIQUID", state_description: "Molten gold", state_color: "#FFA500" }
        ],
        properties: [
            { property_name: "Magnetic", property_value: "No" },
            { property_name: "Corrosion Resistance", property_value: "Very High" },
            { property_name: "Conductivity", property_value: "High" }
        ]
    },

    // STEINE
    {
        material_id: "granite",
        name: "Granite",
        description: "A hard, durable igneous rock commonly used in construction.",
        category: "STONE",
        density: 2700,
        melting_point: 1260,
        boiling_point: null,
        ignite_point: null,
        impact_yield: 130,
        impact_fracture: 180,
        shear_yield: 10,
        shear_fracture: 15,
        hardness: 75,
        sharpness: 20,
        durability: 90,
        color: "Speckled Gray",
        color_hex: "#A5A5A5",
        is_magical: false,
        is_rare: false,
        value_modifier: 1.2,
        source_location: "Mountains, quarries",
        source_creature: null,
        source_plant: null,
        states: [
            { state_name: "SOLID", state_description: "Solid granite", state_color: "#A5A5A5" },
            { state_name: "POWDER", state_description: "Granite dust", state_color: "#D3D3D3" }
        ],
        properties: [
            { property_name: "Heat Resistance", property_value: "High" },
            { property_name: "Water Absorption", property_value: "Low" }
        ]
    },
    {
        material_id: "obsidian",
        name: "Obsidian",
        description: "A naturally occurring volcanic glass, extremely sharp when broken.",
        category: "STONE",
        density: 2550,
        melting_point: 800,
        boiling_point: null,
        ignite_point: null,
        impact_yield: 50,
        impact_fracture: 70,
        shear_yield: 30,
        shear_fracture: 50,
        hardness: 65,
        sharpness: 95,
        durability: 45,
        color: "Black",
        color_hex: "#121212",
        is_magical: false,
        is_rare: true,
        value_modifier: 8.0,
        source_location: "Volcanic regions",
        source_creature: null,
        source_plant: null,
        states: [
            { state_name: "SOLID", state_description: "Solid obsidian", state_color: "#121212" },
            { state_name: "POWDER", state_description: "Obsidian dust", state_color: "#3A3A3A" }
        ],
        properties: [
            { property_name: "Transparency", property_value: "Opaque" },
            { property_name: "Reflectivity", property_value: "High" }
        ]
    },

    // HOLZ
    {
        material_id: "oak",
        name: "Oak Wood",
        description: "A sturdy hardwood known for its strength and durability.",
        category: "WOOD",
        density: 750,
        melting_point: null,
        boiling_point: null,
        ignite_point: 300,
        impact_yield: 40,
        impact_fracture: 70,
        shear_yield: 10,
        shear_fracture: 25,
        hardness: 60,
        sharpness: 5,
        durability: 70,
        color: "Brown",
        color_hex: "#8B4513",
        is_magical: false,
        is_rare: false,
        value_modifier: 1.5,
        source_location: "Forests",
        source_creature: null,
        source_plant: "Oak tree",
        states: [
            { state_name: "SOLID", state_description: "Solid oak wood", state_color: "#8B4513" },
            { state_name: "POWDER", state_description: "Oak sawdust", state_color: "#DEB887" }
        ],
        properties: [
            { property_name: "Buoyancy", property_value: "Floats" },
            { property_name: "Grain", property_value: "Straight" },
            { property_name: "Moisture Resistance", property_value: "Medium" }
        ]
    },

    // LEDER
    {
        material_id: "leather",
        name: "Leather",
        description: "Treated animal hide used for clothing, armor, and various goods.",
        category: "LEATHER",
        density: 860,
        melting_point: null,
        boiling_point: null,
        ignite_point: 200,
        impact_yield: 20,
        impact_fracture: 40,
        shear_yield: 5,
        shear_fracture: 15,
        hardness: 15,
        sharpness: 0,
        durability: 60,
        color: "Brown",
        color_hex: "#8B4513",
        is_magical: false,
        is_rare: false,
        value_modifier: 2.0,
        source_location: null,
        source_creature: "Cattle",
        source_plant: null,
        states: [
            { state_name: "SOLID", state_description: "Leather", state_color: "#8B4513" }
        ],
        properties: [
            { property_name: "Flexibility", property_value: "High" },
            { property_name: "Water Resistance", property_value: "Medium" }
        ]
    },

    // EDELSTEINE
    {
        material_id: "diamond",
        name: "Diamond",
        description: "The hardest known natural material, prized for its beauty and rarity.",
        category: "GEM",
        density: 3520,
        melting_point: 3550,
        boiling_point: 4830,
        ignite_point: null,
        impact_yield: 10000,
        impact_fracture: 11000,
        shear_yield: 5000,
        shear_fracture: 6000,
        hardness: 100,
        sharpness: 100,
        durability: 100,
        color: "Clear",
        color_hex: "#E0FFFF",
        is_magical: false,
        is_rare: true,
        value_modifier: 800.0,
        source_location: "Diamond mines, deep underground",
        source_creature: null,
        source_plant: null,
        states: [
            { state_name: "SOLID", state_description: "Diamond crystal", state_color: "#E0FFFF" },
            { state_name: "POWDER", state_description: "Diamond dust", state_color: "#F0FFFF" }
        ],
        properties: [
            { property_name: "Transparency", property_value: "Transparent" },
            { property_name: "Refractivity", property_value: "Very High" },
            { property_name: "Conductivity", property_value: "Thermal: High, Electrical: None" }
        ]
    },

    // MAGISCHES
    {
        material_id: "arcane-crystal",
        name: "Arcane Crystal",
        description: "A crystalline material that resonates with magical energy.",
        category: "MAGICAL",
        density: 3000,
        melting_point: 2200,
        boiling_point: 3800,
        ignite_point: null,
        impact_yield: 400,
        impact_fracture: 500,
        shear_yield: 350,
        shear_fracture: 450,
        hardness: 85,
        sharpness: 80,
        durability: 90,
        color: "Glowing Blue",
        color_hex: "#00BFFF",
        is_magical: true,
        is_rare: true,
        value_modifier: 250.0,
        source_location: "Magical nexus points, ancient ruins",
        source_creature: null,
        source_plant: null,
        states: [
            { state_name: "SOLID", state_description: "Solid crystal", state_color: "#00BFFF" },
            { state_name: "LIQUID", state_description: "Liquefied arcane essence", state_color: "#00FFFF" },
            { state_name: "GAS", state_description: "Arcane mist", state_color: "#E0FFFF" }
        ],
        properties: [
            { property_name: "Magical Conductivity", property_value: "Very High" },
            { property_name: "Luminosity", property_value: "Self-illuminating" },
            { property_name: "Resonance", property_value: "Amplifies arcane energies" }
        ]
    }
];

// Funktion zum Einfügen der Testdaten
async function seedMaterialsData() {
    console.log("Starting material seed process...");

    const client = await pool.connect();
    let insertedCount = 0;
    let skippedCount = 0;
    let failureCount = 0;

    try {
        // Begin transaction
        await client.query('BEGIN');

        for (const material of sampleMaterials) {
            try {
                // Check if material already exists
                const existingMaterial = await client.query(
                    'SELECT id FROM materials WHERE material_id = $1',
                    [material.material_id]
                );

                if (existingMaterial.rows.length > 0) {
                    console.log(`⏭️ Material with ID ${material.material_id} already exists, skipping...`);
                    skippedCount++;
                    continue;
                }

                // console.log(`🔄 Processing material: ${material.name}`);

                // Insert main material record
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

                // Insert states
                if (material.states && material.states.length > 0) {
                    for (const state of material.states) {
                        await client.query(
                            `INSERT INTO material_states (material_id, state_name, state_description, state_color)
                            VALUES ($1, $2, $3, $4)`,
                            [materialId, state.state_name, state.state_description, state.state_color]
                        );
                    }
                }

                // Insert properties
                if (material.properties && material.properties.length > 0) {
                    for (const prop of material.properties) {
                        await client.query(
                            `INSERT INTO material_properties (material_id, property_name, property_value)
                            VALUES ($1, $2, $3)`,
                            [materialId, prop.property_name, prop.property_value]
                        );
                    }
                }

                insertedCount++;
                console.log(`✅ Successfully added material: ${material.name}`);
            } catch (error) {
                failureCount++;
                console.error(`❌ Error adding material ${material.name}: ${error.message}`);
            }
        }

        // Commit transaction
        await client.query('COMMIT');
        console.log(`\nMaterials seeding completed: ${insertedCount} successful, ${skippedCount} skipped, ${failureCount} failed`);
        console.log(`Total materials attempted: ${sampleMaterials.length}`);

    } catch (error) {
        // Rollback in case of error
        await client.query('ROLLBACK');
        console.error("❌ Error seeding materials:", error);
        throw error;
    } finally {
        client.release();
    }
}


// Run the seed function
seedMaterialsData()
    .then(() => {
        console.log("Materials seeding complete");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Materials seeding failed:", error);
        process.exit(1);
    });