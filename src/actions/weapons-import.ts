// src/actions/import-weapons.ts
"use server";

import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { WeaponType, WeaponCategory, GraspType } from "@/types/weapon";
import { mutate, transaction } from "@/lib/db";

// Create a schema to validate the imported JSON data
const RangeDataSchema = z.object({
  precision: z.number().min(0).max(100),
  distance: z.number().min(0),
});

// Helper for converting string or number values
const numberOrString = z.union([
  z.number(),
  z.string().transform((val) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }),
]);

const WeaponImportSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(""),
  type: z.nativeEnum(WeaponType),
  category: z.nativeEnum(WeaponCategory),
  baseDamage: z
    .array(numberOrString)
    .min(2)
    .max(2)
    .transform((values) =>
      values.map((v) => (typeof v === "number" ? v : parseFloat(v)))
    ),
  weight: z
    .array(numberOrString)
    .min(2)
    .max(2)
    .transform((values) =>
      values.map((v) => (typeof v === "number" ? v : parseFloat(v)))
    ),
  price: numberOrString,
  material: z.string(),
  durability: numberOrString,
  grasp: z.array(z.nativeEnum(GraspType)).min(1),
  properties: z.array(z.string()).optional().default([]),
  imageUrl: z.string().url().optional().nullable(),
  range: z.record(z.number(), z.number()).optional(),
});

// Array schema for validating multiple weapons
const WeaponsImportSchema = z.array(WeaponImportSchema);

/**
 * Imports weapons from JSON data into the database
 */
export async function importWeapons(jsonData: string) {
  try {
    // Parse and validate the JSON data
    const parsedData = JSON.parse(jsonData);
    const validationResult = WeaponsImportSchema.safeParse(parsedData);

    if (!validationResult.success) {
      return {
        success: false,
        message: "Invalid weapon data format",
        errors: validationResult.error.errors,
      };
    }

    const weapons = validationResult.data;

    // Insert the weapons using a transaction to ensure all-or-nothing behavior
    const result = await transaction(async (client) => {
      const insertedWeapons = [];

      for (const weapon of weapons) {
        // Generate a unique ID for each weapon
        const weaponId = uuidv4();

        // Insert the main weapon record
        const weaponResult = await client.query(
          `INSERT INTO weapons (
            weapon_id, name, description, type, category, 
            base_damage_min, base_damage_max, weight_min, weight_max,
            price, material, durability, properties, image_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id`,
          [
            weaponId,
            weapon.name,
            weapon.description,
            weapon.type,
            weapon.category,
            weapon.baseDamage[0],
            weapon.baseDamage[1],
            weapon.weight[0],
            weapon.weight[1],
            weapon.price,
            weapon.material,
            weapon.durability,
            weapon.properties,
            weapon.imageUrl || null,
          ]
        );

        const weaponDbId = weaponResult.rows[0].id;

        // Insert grasp types
        for (const graspType of weapon.grasp) {
          await client.query(
            `INSERT INTO weapon_grasp (weapon_id, grasp_type)
            VALUES ($1, $2)`,
            [weaponDbId, graspType]
          );
        }

        // Insert range data if available
        if (weapon.range) {
          for (const [precision, distance] of Object.entries(weapon.range)) {
            await client.query(
              `INSERT INTO weapon_range (weapon_id, precision_value, distance)
              VALUES ($1, $2, $3)`,
              [weaponDbId, Number(precision), Number(distance)]
            );
          }
        }

        insertedWeapons.push(weaponId);
      }

      return insertedWeapons;
    });

    return {
      success: true,
      message: `Successfully imported ${result.length} weapon(s)`,
      importedIds: result,
    };
  } catch (error) {
    console.error("Error importing weapons:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
