#!/usr/bin/env node

// scripts/clean-database.js
const { Pool } = require('pg');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Configure PostgreSQL connection
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ask for confirmation before proceeding
function confirm(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

// Clean tables
async function cleanTables(tables) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const table of tables) {
            console.log(`Clearing table: ${table}...`);
            await client.query(`DELETE FROM ${table}`);
            console.log(`Table ${table} cleared.`);
        }

        await client.query('COMMIT');
        console.log("Database clean completed successfully");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error cleaning database:", error);
        throw error;
    } finally {
        client.release();
    }
}

// Main function
async function main() {
    console.log("⚠️ WARNING: This script will delete all data from the specified tables!");
    console.log("Database:", process.env.POSTGRES_DATABASE);
    console.log("Host:", process.env.POSTGRES_HOST);

    // Tables to clean in the correct order (respecting foreign key constraints)
    const tables = [
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

    console.log("\nTables that will be cleared:");
    tables.forEach(table => console.log(`- ${table}`));

    const confirmed = await confirm("\nDo you want to proceed? (y/N): ");

    if (confirmed) {
        await cleanTables(tables);
        console.log("✅ Database clean completed.");
    } else {
        console.log("Operation cancelled.");
    }

    rl.close();
    await pool.end();
}

// Execute main function
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
