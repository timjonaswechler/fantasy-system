// src/actions/materials.ts
"use server";

import { revalidatePath } from "next/cache";
import { query, mutate, transaction } from "@/lib/db";
import {
  IMaterial,
  MaterialCategory,
  MaterialState,
  MaterialFormData,
} from "@/types/material";

// Helper function to generate a unique ID for a material
function generateMaterialId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Server Action to fetch all materials
export async function getMaterials(): Promise<IMaterial[]> {
  try {
    // Get materials from database
    const materials = await query<any>(`
      SELECT 
        m.id, 
        m.material_id as id, 
        m.name, 
        m.description, 
        m.category, 
        m.density, 
        m.melting_point as "meltingPoint", 
        m.boiling_point as "boilingPoint", 
        m.ignite_point as "ignitePoint",
        m.impact_yield as "impactYield", 
        m.impact_fracture as "impactFracture", 
        m.shear_yield as "shearYield", 
        m.shear_fracture as "shearFracture",
        m.hardness, 
        m.sharpness, 
        m.durability,
        m.color,
        m.color_hex as "colorHex",
        m.is_magical as "isMagical",
        m.is_rare as "isRare",
        m.value_modifier as "valueModifier",
        m.source_location as "sourceLocation",
        m.source_creature as "sourceCreature",
        m.source_plant as "sourcePlant",
        m.created_at as "createdAt"
      FROM materials m
      ORDER BY m.name ASC
    `);

    // Get additional properties for each material
    const materialIds = materials.map((m) => m.id);
    const properties = await query<any>(
      `
      SELECT 
        mp.material_id, 
        mp.property_name, 
        mp.property_value
      FROM material_properties mp
      JOIN materials m ON m.id = mp.material_id
      WHERE m.material_id = ANY($1)
      `,
      [materialIds]
    );

    // Get states for each material
    const states = await query<any>(
      `
      SELECT 
        ms.material_id, 
        ms.state_name, 
        ms.state_description, 
        ms.state_color
      FROM material_states ms
      JOIN materials m ON m.id = ms.material_id
      WHERE m.material_id = ANY($1)
      `,
      [materialIds]
    );

    // Map the database results to the IMaterial interface
    return materials.map((material) => {
      // Convert the properties to a Map
      const propertiesMap = new Map<string, string>();
      properties
        .filter((p) => p.material_id === material.dbId)
        .forEach((p) => {
          propertiesMap.set(p.property_name, p.property_value);
        });

      // Convert the states to a Map
      const statesMap = new Map<
        MaterialState,
        { description?: string; color?: string }
      >();
      states
        .filter((s) => s.material_id === material.dbId)
        .forEach((s) => {
          statesMap.set(s.state_name as MaterialState, {
            description: s.state_description,
            color: s.state_color,
          });
        });

      return {
        id: material.id,
        name: material.name,
        description: material.description || "",
        category: material.category as MaterialCategory,
        density:
          typeof material.density === "string"
            ? parseFloat(material.density)
            : material.density,
        meltingPoint:
          typeof material.meltingPoint === "string"
            ? parseFloat(material.meltingPoint)
            : material.meltingPoint,
        boilingPoint:
          typeof material.boilingPoint === "string"
            ? parseFloat(material.boilingPoint)
            : material.boilingPoint,
        ignitePoint:
          typeof material.ignitePoint === "string"
            ? parseFloat(material.ignitePoint)
            : material.ignitePoint,
        impactYield:
          typeof material.impactYield === "string"
            ? parseFloat(material.impactYield)
            : material.impactYield,
        impactFracture:
          typeof material.impactFracture === "string"
            ? parseFloat(material.impactFracture)
            : material.impactFracture,
        shearYield:
          typeof material.shearYield === "string"
            ? parseFloat(material.shearYield)
            : material.shearYield,
        shearFracture:
          typeof material.shearFracture === "string"
            ? parseFloat(material.shearFracture)
            : material.shearFracture,
        hardness:
          typeof material.hardness === "string"
            ? parseFloat(material.hardness)
            : material.hardness,
        sharpness:
          typeof material.sharpness === "string"
            ? parseFloat(material.sharpness)
            : material.sharpness,
        durability:
          typeof material.durability === "string"
            ? parseFloat(material.durability)
            : material.durability,
        color: material.color,
        colorHex: material.colorHex,
        isMagical: Boolean(material.isMagical),
        isRare: Boolean(material.isRare),
        valueModifier:
          typeof material.valueModifier === "string"
            ? parseFloat(material.valueModifier)
            : material.valueModifier || 1.0,
        sourceLocation: material.sourceLocation,
        sourceCreature: material.sourceCreature,
        sourcePlant: material.sourcePlant,
        properties: propertiesMap,
        states: statesMap,
        createdAt: new Date(material.createdAt),
      };
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    throw new Error("Failed to fetch materials");
  }
}

// Server Action to fetch material by ID
export async function getMaterialById(id: string): Promise<IMaterial | null> {
  try {
    // Get material from database
    const materials = await query<any>(
      `
      SELECT 
        m.id as "dbId",
        m.material_id as id, 
        m.name, 
        m.description, 
        m.category, 
        m.density, 
        m.melting_point as "meltingPoint", 
        m.boiling_point as "boilingPoint", 
        m.ignite_point as "ignitePoint",
        m.impact_yield as "impactYield", 
        m.impact_fracture as "impactFracture", 
        m.shear_yield as "shearYield", 
        m.shear_fracture as "shearFracture",
        m.hardness, 
        m.sharpness, 
        m.durability,
        m.color,
        m.color_hex as "colorHex",
        m.is_magical as "isMagical",
        m.is_rare as "isRare",
        m.value_modifier as "valueModifier",
        m.source_location as "sourceLocation",
        m.source_creature as "sourceCreature",
        m.source_plant as "sourcePlant",
        m.created_at as "createdAt"
      FROM materials m
      WHERE m.material_id = $1
    `,
      [id]
    );

    if (materials.length === 0) {
      return null;
    }

    const material = materials[0];

    // Get properties for the material
    const properties = await query<any>(
      `
      SELECT 
        property_name, 
        property_value
      FROM material_properties
      WHERE material_id = $1
    `,
      [material.dbId]
    );

    // Get states for the material
    const states = await query<any>(
      `
      SELECT 
        state_name, 
        state_description, 
        state_color
      FROM material_states
      WHERE material_id = $1
    `,
      [material.dbId]
    );

    // Convert the properties to a Map
    const propertiesMap = new Map<string, string>();
    properties.forEach((p) => {
      propertiesMap.set(p.property_name, p.property_value);
    });

    // Convert the states to a Map
    const statesMap = new Map<
      MaterialState,
      { description?: string; color?: string }
    >();
    states.forEach((s) => {
      statesMap.set(s.state_name as MaterialState, {
        description: s.state_description,
        color: s.state_color,
      });
    });

    return {
      id: material.id,
      name: material.name,
      description: material.description || "",
      category: material.category as MaterialCategory,
      density:
        typeof material.density === "string"
          ? parseFloat(material.density)
          : material.density,
      meltingPoint:
        typeof material.meltingPoint === "string"
          ? parseFloat(material.meltingPoint)
          : material.meltingPoint,
      boilingPoint:
        typeof material.boilingPoint === "string"
          ? parseFloat(material.boilingPoint)
          : material.boilingPoint,
      ignitePoint:
        typeof material.ignitePoint === "string"
          ? parseFloat(material.ignitePoint)
          : material.ignitePoint,
      impactYield:
        typeof material.impactYield === "string"
          ? parseFloat(material.impactYield)
          : material.impactYield,
      impactFracture:
        typeof material.impactFracture === "string"
          ? parseFloat(material.impactFracture)
          : material.impactFracture,
      shearYield:
        typeof material.shearYield === "string"
          ? parseFloat(material.shearYield)
          : material.shearYield,
      shearFracture:
        typeof material.shearFracture === "string"
          ? parseFloat(material.shearFracture)
          : material.shearFracture,
      hardness:
        typeof material.hardness === "string"
          ? parseFloat(material.hardness)
          : material.hardness,
      sharpness:
        typeof material.sharpness === "string"
          ? parseFloat(material.sharpness)
          : material.sharpness,
      durability:
        typeof material.durability === "string"
          ? parseFloat(material.durability)
          : material.durability,
      color: material.color,
      colorHex: material.colorHex,
      isMagical: Boolean(material.isMagical),
      isRare: Boolean(material.isRare),
      valueModifier:
        typeof material.valueModifier === "string"
          ? parseFloat(material.valueModifier)
          : material.valueModifier || 1.0,
      sourceLocation: material.sourceLocation,
      sourceCreature: material.sourceCreature,
      sourcePlant: material.sourcePlant,
      properties: propertiesMap,
      states: statesMap,
      createdAt: new Date(material.createdAt),
    };
  } catch (error) {
    console.error(`Error fetching material with ID ${id}:`, error);
    throw new Error("Failed to fetch material");
  }
}

// Server Action to create a new material
export async function createMaterial(formData: MaterialFormData) {
  try {
    return await transaction(async (client) => {
      // Generate a unique material_id based on name
      const materialId = generateMaterialId(formData.name);

      // Insert material into database
      const result = await client.query(
        `
        INSERT INTO materials (
          material_id, 
          name, 
          description, 
          category,
          density, 
          melting_point, 
          boiling_point, 
          ignite_point,
          impact_yield, 
          impact_fracture, 
          shear_yield, 
          shear_fracture,
          hardness, 
          sharpness, 
          durability,
          color,
          color_hex,
          is_magical,
          is_rare,
          value_modifier,
          source_location,
          source_creature,
          source_plant
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        ) RETURNING id
      `,
        [
          materialId,
          formData.name,
          formData.description,
          formData.category,
          formData.density,
          formData.meltingPoint,
          formData.boilingPoint,
          formData.ignitePoint,
          formData.impactYield,
          formData.impactFracture,
          formData.shearYield,
          formData.shearFracture,
          formData.hardness,
          formData.sharpness,
          formData.durability,
          formData.color,
          formData.colorHex,
          formData.isMagical || false,
          formData.isRare || false,
          formData.valueModifier || 1.0,
          formData.sourceLocation,
          formData.sourceCreature,
          formData.sourcePlant,
        ]
      );

      const materialDbId = result.rows[0].id;

      // Insert properties if provided
      if (formData.properties && formData.properties.length > 0) {
        for (const prop of formData.properties) {
          await client.query(
            `
            INSERT INTO material_properties (material_id, property_name, property_value)
            VALUES ($1, $2, $3)
          `,
            [materialDbId, prop.name, prop.value]
          );
        }
      }

      // Insert states if provided
      if (formData.states && formData.states.length > 0) {
        for (const state of formData.states) {
          await client.query(
            `
            INSERT INTO material_states (material_id, state_name, state_description, state_color)
            VALUES ($1, $2, $3, $4)
          `,
            [materialDbId, state.state, state.description, state.color]
          );
        }
      }

      // Revalidate pages
      revalidatePath("/materials");

      return { success: true, id: materialId };
    });
  } catch (error) {
    console.error("Error creating material:", error);
    throw new Error("Failed to create material");
  }
}

// Server Action to update a material
export async function updateMaterial(id: string, formData: MaterialFormData) {
  try {
    return await transaction(async (client) => {
      // First get the database ID from the material_id
      const idResult = await client.query(
        `
        SELECT id FROM materials WHERE material_id = $1
      `,
        [id]
      );

      if (idResult.rows.length === 0) {
        throw new Error(`Material with ID ${id} not found`);
      }

      const materialDbId = idResult.rows[0].id;

      // Update material in database
      await client.query(
        `
        UPDATE materials SET
          name = $1,
          description = $2,
          category = $3,
          density = $4,
          melting_point = $5,
          boiling_point = $6,
          ignite_point = $7,
          impact_yield = $8,
          impact_fracture = $9,
          shear_yield = $10,
          shear_fracture = $11,
          hardness = $12,
          sharpness = $13,
          durability = $14,
          color = $15,
          color_hex = $16,
          is_magical = $17,
          is_rare = $18,
          value_modifier = $19,
          source_location = $20,
          source_creature = $21,
          source_plant = $22,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $23
      `,
        [
          formData.name,
          formData.description,
          formData.category,
          formData.density,
          formData.meltingPoint,
          formData.boilingPoint,
          formData.ignitePoint,
          formData.impactYield,
          formData.impactFracture,
          formData.shearYield,
          formData.shearFracture,
          formData.hardness,
          formData.sharpness,
          formData.durability,
          formData.color,
          formData.colorHex,
          formData.isMagical || false,
          formData.isRare || false,
          formData.valueModifier || 1.0,
          formData.sourceLocation,
          formData.sourceCreature,
          formData.sourcePlant,
          materialDbId,
        ]
      );

      // Delete existing properties
      await client.query(
        `
        DELETE FROM material_properties WHERE material_id = $1
      `,
        [materialDbId]
      );

      // Insert new properties
      if (formData.properties && formData.properties.length > 0) {
        for (const prop of formData.properties) {
          await client.query(
            `
            INSERT INTO material_properties (material_id, property_name, property_value)
            VALUES ($1, $2, $3)
          `,
            [materialDbId, prop.name, prop.value]
          );
        }
      }

      // Delete existing states
      await client.query(
        `
        DELETE FROM material_states WHERE material_id = $1
      `,
        [materialDbId]
      );

      // Insert new states
      if (formData.states && formData.states.length > 0) {
        for (const state of formData.states) {
          await client.query(
            `
            INSERT INTO material_states (material_id, state_name, state_description, state_color)
            VALUES ($1, $2, $3, $4)
          `,
            [materialDbId, state.state, state.description, state.color]
          );
        }
      }

      // Revalidate pages
      revalidatePath(`/materials/${id}`);
      revalidatePath("/materials");

      return { success: true };
    });
  } catch (error) {
    console.error(`Error updating material with ID ${id}:`, error);
    throw new Error("Failed to update material");
  }
}

// Server Action to delete a material
export async function deleteMaterial(id: string) {
  try {
    // First get the database ID from the material_id
    const idResult = await query<any>(
      `
      SELECT id FROM materials WHERE material_id = $1
    `,
      [id]
    );

    if (idResult.length === 0) {
      throw new Error(`Material with ID ${id} not found`);
    }

    const materialDbId = idResult[0].id;

    // The foreign key constraints will automatically delete related records
    await mutate(
      `
      DELETE FROM materials WHERE id = $1
    `,
      [materialDbId]
    );

    // Revalidate pages
    revalidatePath("/materials");

    return { success: true };
  } catch (error) {
    console.error(`Error deleting material with ID ${id}:`, error);
    throw new Error("Failed to delete material");
  }
}

// Server Action to get materials by category
export async function getMaterialsByCategory(
  category: MaterialCategory
): Promise<IMaterial[]> {
  try {
    const materialsOfCategory = await query<any>(
      `
      SELECT 
        material_id as id 
      FROM materials 
      WHERE category = $1
    `,
      [category]
    );

    const materialIds = materialsOfCategory.map((m) => m.id);

    // Use the existing getMaterials function and filter
    const allMaterials = await getMaterials();
    return allMaterials.filter((material) => materialIds.includes(material.id));
  } catch (error) {
    console.error(`Error fetching materials of category ${category}:`, error);
    throw new Error("Failed to fetch materials by category");
  }
}

// Seed materials data - for initial setup or development
export async function seedMaterialsData(materials: MaterialFormData[]) {
  try {
    return await transaction(async (client) => {
      const results = [];

      for (const material of materials) {
        // Generate a unique material_id based on name
        const materialId = generateMaterialId(material.name);

        // Insert material into database
        const result = await client.query(
          `
          INSERT INTO materials (
            material_id, 
            name, 
            description, 
            category,
            density, 
            melting_point, 
            boiling_point, 
            ignite_point,
            impact_yield, 
            impact_fracture, 
            shear_yield, 
            shear_fracture,
            hardness, 
            sharpness, 
            durability,
            color,
            color_hex,
            is_magical,
            is_rare,
            value_modifier,
            source_location,
            source_creature,
            source_plant
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
          ) RETURNING id
        `,
          [
            materialId,
            material.name,
            material.description,
            material.category,
            material.density,
            material.meltingPoint,
            material.boilingPoint,
            material.ignitePoint,
            material.impactYield,
            material.impactFracture,
            material.shearYield,
            material.shearFracture,
            material.hardness,
            material.sharpness,
            material.durability,
            material.color,
            material.colorHex,
            material.isMagical || false,
            material.isRare || false,
            material.valueModifier || 1.0,
            material.sourceLocation,
            material.sourceCreature,
            material.sourcePlant,
          ]
        );

        const materialDbId = result.rows[0].id;

        // Insert properties if provided
        if (material.properties && material.properties.length > 0) {
          for (const prop of material.properties) {
            await client.query(
              `
              INSERT INTO material_properties (material_id, property_name, property_value)
              VALUES ($1, $2, $3)
            `,
              [materialDbId, prop.name, prop.value]
            );
          }
        }

        // Insert states if provided
        if (material.states && material.states.length > 0) {
          for (const state of material.states) {
            await client.query(
              `
              INSERT INTO material_states (material_id, state_name, state_description, state_color)
              VALUES ($1, $2, $3, $4)
            `,
              [materialDbId, state.state, state.description, state.color]
            );
          }
        }

        results.push({ id: materialId, name: material.name });
      }

      // Revalidate pages
      revalidatePath("/materials");

      return { success: true, materials: results };
    });
  } catch (error) {
    console.error("Error seeding materials data:", error);
    throw new Error("Failed to seed materials data");
  }
}
