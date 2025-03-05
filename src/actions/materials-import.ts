// src/actions/materials-import.ts
"use server";

import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { MaterialCategory } from "@/types/material";
import { mutate, transaction } from "@/lib/db";

// Schema für die Validierung importierter JSON-Daten
const MaterialImportSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(""),
  category: z.nativeEnum(MaterialCategory),
  density: z.number().min(0),
  valueModifier: z.number().min(0).default(1.0),

  // Physikalische Eigenschaften
  impactYield: z.number().min(0),
  impactFracture: z.number().min(0),
  impactStrainAtYield: z.number().min(0),
  shearYield: z.number().min(0),
  shearFracture: z.number().min(0),
  shearStrainAtYield: z.number().min(0),

  // Thermische Eigenschaften
  meltingPoint: z.number().optional(),
  boilingPoint: z.number().optional(),
  ignitePoint: z.number().optional(),
  specificHeat: z.number().optional(),

  // Visuelle Eigenschaften
  displayColor: z.string().default("#CCCCCC"),

  // Kategorische Flags
  isMetal: z.boolean().default(false),
  isStone: z.boolean().default(false),
  isGem: z.boolean().default(false),
  isOrganic: z.boolean().default(false),
  isFabric: z.boolean().default(false),

  // Zusätzliche Eigenschaften
  additionalProperties: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

// Array-Schema für die Validierung mehrerer Materialien
const MaterialsImportSchema = z.array(MaterialImportSchema);

/**
 * Importiert Materialien aus JSON-Daten in die Datenbank
 */
export async function importMaterials(jsonData: string) {
  try {
    // JSON-Daten parsen und validieren
    const parsedData = JSON.parse(jsonData);
    const validationResult = MaterialsImportSchema.safeParse(parsedData);

    if (!validationResult.success) {
      return {
        success: false,
        message: "Ungültiges Materialien-Datenformat",
        errors: validationResult.error.errors,
      };
    }

    const materials = validationResult.data;

    // Materialien mithilfe einer Transaktion einfügen (Alles-oder-Nichts-Verhalten)
    const result = await transaction(async (client) => {
      const insertedMaterials = [];

      for (const material of materials) {
        // Eindeutige ID für jedes Material generieren
        const materialId = uuidv4();

        // Materialnamen für die Slug-Generierung vorbereiten
        const slugId = material.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        // Hauptmaterial-Datensatz einfügen
        const materialResult = await client.query(
          `INSERT INTO materials (
            material_id, name, description, category, density, 
            value_modifier, impact_yield, impact_fracture, impact_strain_at_yield,
            shear_yield, shear_fracture, shear_strain_at_yield,
            melting_point, boiling_point, ignite_point, specific_heat,
            display_color, is_metal, is_stone, is_gem, is_organic, is_fabric
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
            $14, $15, $16, $17, $18, $19, $20, $21, $22)
          RETURNING id`,
          [
            slugId, // oder materialId, wenn du UUID verwenden möchtest
            material.name,
            material.description,
            material.category,
            material.density,
            material.valueModifier,
            material.impactYield,
            material.impactFracture,
            material.impactStrainAtYield,
            material.shearYield,
            material.shearFracture,
            material.shearStrainAtYield,
            material.meltingPoint || null,
            material.boilingPoint || null,
            material.ignitePoint || null,
            material.specificHeat || null,
            material.displayColor,
            material.isMetal,
            material.isStone,
            material.isGem,
            material.isOrganic,
            material.isFabric,
          ]
        );

        const materialDbId = materialResult.rows[0].id;

        // Zusätzliche Eigenschaften einfügen, falls vorhanden
        if (material.additionalProperties) {
          for (const [key, value] of Object.entries(
            material.additionalProperties
          )) {
            const valueType = typeof value;
            await client.query(
              `INSERT INTO material_properties (material_id, key, value, value_type)
              VALUES ($1, $2, $3, $4)`,
              [materialDbId, key, String(value), valueType]
            );
          }
        }

        insertedMaterials.push(slugId);
      }

      return insertedMaterials;
    });

    return {
      success: true,
      message: `${result.length} Material(ien) erfolgreich importiert`,
      importedIds: result,
    };
  } catch (error) {
    console.error("Fehler beim Importieren der Materialien:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Ein unbekannter Fehler ist aufgetreten",
    };
  }
}
