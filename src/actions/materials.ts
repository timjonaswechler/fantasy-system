// src/actions/materials.ts
"use server";

import { revalidatePath } from "next/cache";
import { query, mutate, transaction } from "@/lib/db";
import {
  IMaterial,
  MaterialCategory,
  MaterialFormData,
  MaterialState,
} from "@/types/material";

// Server Action zum Abrufen aller Materialien
export async function getMaterials(): Promise<IMaterial[]> {
  try {
    // Materialien aus der Datenbank abrufen
    const materials = await query<any>(`
      SELECT 
        m.id as "dbId",
        m.material_id as id, 
        m.name, 
        m.category, 
        m.description, 
        m.density,
        m.value_modifier as "valueModifier",
        m.impact_yield as "impactYield",
        m.impact_fracture as "impactFracture",
        m.impact_strain_at_yield as "impactStrainAtYield",
        m.shear_yield as "shearYield",
        m.shear_fracture as "shearFracture",
        m.shear_strain_at_yield as "shearStrainAtYield",
        m.melting_point as "meltingPoint",
        m.boiling_point as "boilingPoint",
        m.ignite_point as "ignitePoint",
        m.specific_heat as "specificHeat",
        m.display_color as "displayColor",
        m.is_metal as "isMetal",
        m.is_stone as "isStone",
        m.is_gem as "isGem",
        m.is_organic as "isOrganic",
        m.is_fabric as "isFabric",
        m.created_at as "createdAt",
        m.updated_at as "updatedAt"
      FROM materials m
      ORDER BY m.name ASC
    `);

    // Material-IDs für die erweiterten Eigenschaften abrufen
    const materialIds = materials.map((m) => m.dbId);

    // Erweiterte Eigenschaften für alle Materialien abrufen
    const properties = await query<any>(
      `
      SELECT 
        mp.material_id as "materialId", 
        mp.key, 
        mp.value,
        mp.value_type as "valueType",
        m.material_id as "externalId"
      FROM material_properties mp
      JOIN materials m ON m.id = mp.material_id
      WHERE mp.material_id = ANY($1)
      `,
      [materialIds]
    );

    // Optional: Material-Zustände abrufen, wenn benötigt
    const states = await query<any>(
      `
      SELECT 
        ms.material_id as "materialId", 
        ms.state,
        ms.state_description as "stateDescription",
        ms.transition_temperature as "transitionTemperature",
        ms.transition_energy as "transitionEnergy",
        m.material_id as "externalId"
      FROM material_states ms
      JOIN materials m ON m.id = ms.material_id
      WHERE ms.material_id = ANY($1)
      `,
      [materialIds]
    );

    // Mapping der Datenbankdaten auf die IMaterial-Schnittstelle
    return materials.map((material) => {
      // Erweiterte Eigenschaften für dieses Material sammeln
      const materialProperties = properties
        .filter((p) => p.materialId === material.dbId)
        .reduce((acc, prop) => {
          let value: any = prop.value;
          // Wert entsprechend seinem Typ konvertieren
          if (prop.valueType === "number") value = parseFloat(value);
          else if (prop.valueType === "boolean") value = value === "true";
          acc[prop.key] = value;
          return acc;
        }, {});

      // Zustände für dieses Material sammeln (wenn benötigt)
      const materialStates = states
        .filter((s) => s.materialId === material.dbId)
        .map((s) => ({
          state: s.state,
          description: s.stateDescription,
          transitionTemperature: s.transitionTemperature,
          transitionEnergy: s.transitionEnergy,
        }));

      // Material-Objekt zurückgeben
      return {
        id: material.id,
        name: material.name,
        category: material.category as MaterialCategory,
        description: material.description || "",
        density: parseFloat(material.density) || 0,
        valueModifier: parseFloat(material.valueModifier) || 1.0,
        impactYield: parseFloat(material.impactYield) || 0,
        impactFracture: parseFloat(material.impactFracture) || 0,
        impactStrainAtYield: parseFloat(material.impactStrainAtYield) || 0,
        shearYield: parseFloat(material.shearYield) || 0,
        shearFracture: parseFloat(material.shearFracture) || 0,
        shearStrainAtYield: parseFloat(material.shearStrainAtYield) || 0,
        meltingPoint: material.meltingPoint
          ? parseFloat(material.meltingPoint)
          : undefined,
        boilingPoint: material.boilingPoint
          ? parseFloat(material.boilingPoint)
          : undefined,
        ignitePoint: material.ignitePoint
          ? parseFloat(material.ignitePoint)
          : undefined,
        specificHeat: material.specificHeat
          ? parseFloat(material.specificHeat)
          : undefined,
        displayColor: material.displayColor || "#CCCCCC",
        isMetal: Boolean(material.isMetal),
        isStone: Boolean(material.isStone),
        isGem: Boolean(material.isGem),
        isOrganic: Boolean(material.isOrganic),
        isFabric: Boolean(material.isFabric),
        additionalProperties:
          Object.keys(materialProperties).length > 0
            ? materialProperties
            : undefined,
        createdAt: material.createdAt
          ? new Date(material.createdAt)
          : undefined,
        updatedAt: material.updatedAt
          ? new Date(material.updatedAt)
          : undefined,
        // Bei Bedarf: states: materialStates
      };
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    throw new Error("Failed to fetch materials");
  }
}

// Material anhand seiner ID abrufen
export async function getMaterialById(id: string): Promise<IMaterial | null> {
  try {
    // Material aus der Datenbank abrufen
    const materials = await query<any>(
      `
      SELECT 
        m.id as "dbId",
        m.material_id as id, 
        m.name, 
        m.category, 
        m.description, 
        m.density,
        m.value_modifier as "valueModifier",
        m.impact_yield as "impactYield",
        m.impact_fracture as "impactFracture",
        m.impact_strain_at_yield as "impactStrainAtYield",
        m.shear_yield as "shearYield",
        m.shear_fracture as "shearFracture",
        m.shear_strain_at_yield as "shearStrainAtYield",
        m.melting_point as "meltingPoint",
        m.boiling_point as "boilingPoint",
        m.ignite_point as "ignitePoint",
        m.specific_heat as "specificHeat",
        m.display_color as "displayColor",
        m.is_metal as "isMetal",
        m.is_stone as "isStone",
        m.is_gem as "isGem",
        m.is_organic as "isOrganic",
        m.is_fabric as "isFabric",
        m.created_at as "createdAt",
        m.updated_at as "updatedAt"
      FROM materials m
      WHERE m.material_id = $1
    `,
      [id]
    );

    if (materials.length === 0) {
      return null;
    }

    const material = materials[0];

    // Erweiterte Eigenschaften für das Material abrufen
    const properties = await query<any>(
      `
      SELECT key, value, value_type as "valueType"
      FROM material_properties
      WHERE material_id = $1
    `,
      [material.dbId]
    );

    // Materialeigenschaften in ein Objekt umwandeln
    const additionalProperties = properties.reduce(
      (acc: Record<string, any>, prop: any) => {
        let value: any = prop.value;
        if (prop.valueType === "number") value = parseFloat(value);
        else if (prop.valueType === "boolean") value = value === "true";
        acc[prop.key] = value;
        return acc;
      },
      {}
    );

    // Material-Objekt zurückgeben
    return {
      id: material.id,
      name: material.name,
      category: material.category as MaterialCategory,
      description: material.description || "",
      density: parseFloat(material.density) || 0,
      valueModifier: parseFloat(material.valueModifier) || 1.0,
      impactYield: parseFloat(material.impactYield) || 0,
      impactFracture: parseFloat(material.impactFracture) || 0,
      impactStrainAtYield: parseFloat(material.impactStrainAtYield) || 0,
      shearYield: parseFloat(material.shearYield) || 0,
      shearFracture: parseFloat(material.shearFracture) || 0,
      shearStrainAtYield: parseFloat(material.shearStrainAtYield) || 0,
      meltingPoint: material.meltingPoint
        ? parseFloat(material.meltingPoint)
        : undefined,
      boilingPoint: material.boilingPoint
        ? parseFloat(material.boilingPoint)
        : undefined,
      ignitePoint: material.ignitePoint
        ? parseFloat(material.ignitePoint)
        : undefined,
      specificHeat: material.specificHeat
        ? parseFloat(material.specificHeat)
        : undefined,
      displayColor: material.displayColor || "#CCCCCC",
      isMetal: Boolean(material.isMetal),
      isStone: Boolean(material.isStone),
      isGem: Boolean(material.isGem),
      isOrganic: Boolean(material.isOrganic),
      isFabric: Boolean(material.isFabric),
      additionalProperties:
        Object.keys(additionalProperties).length > 0
          ? additionalProperties
          : undefined,
      createdAt: material.createdAt ? new Date(material.createdAt) : undefined,
      updatedAt: material.updatedAt ? new Date(material.updatedAt) : undefined,
    };
  } catch (error) {
    console.error(`Error fetching material with ID ${id}:`, error);
    throw new Error("Failed to fetch material");
  }
}

// Neues Material erstellen
export async function createMaterial(formData: MaterialFormData) {
  try {
    return await transaction(async (client) => {
      // Einzigartige material_id basierend auf dem Namen generieren (slug-Format)
      const materialId = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Material in die Datenbank einfügen
      const result = await client.query(
        `
        INSERT INTO materials (
          material_id, name, category, description, density, 
          value_modifier, impact_yield, impact_fracture, impact_strain_at_yield,
          shear_yield, shear_fracture, shear_strain_at_yield,
          melting_point, boiling_point, ignite_point, specific_heat,
          display_color, is_metal, is_stone, is_gem, is_organic, is_fabric
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
          $14, $15, $16, $17, $18, $19, $20, $21, $22
        ) RETURNING id
      `,
        [
          materialId,
          formData.name,
          formData.category,
          formData.description || "",
          formData.density || 0,
          formData.valueModifier || 1.0,
          formData.impactYield || 0,
          formData.impactFracture || 0,
          formData.impactStrainAtYield || 0,
          formData.shearYield || 0,
          formData.shearFracture || 0,
          formData.shearStrainAtYield || 0,
          formData.meltingPoint || null,
          formData.boilingPoint || null,
          formData.ignitePoint || null,
          formData.specificHeat || null,
          formData.displayColor || "#CCCCCC",
          formData.isMetal || false,
          formData.isStone || false,
          formData.isGem || false,
          formData.isOrganic || false,
          formData.isFabric || false,
        ]
      );

      const materialDbId = result.rows[0].id;

      // Zusätzliche Eigenschaften speichern, falls vorhanden
      if (
        formData.additionalProperties &&
        typeof formData.additionalProperties === "object"
      ) {
        for (const [key, value] of Object.entries(
          formData.additionalProperties
        )) {
          const valueType = typeof value;
          await client.query(
            `
            INSERT INTO material_properties (material_id, key, value, value_type)
            VALUES ($1, $2, $3, $4)
          `,
            [materialDbId, key, String(value), valueType]
          );
        }
      }

      // Seiten revalidieren
      revalidatePath("/materials");

      return { success: true, id: materialId };
    });
  } catch (error) {
    console.error("Error creating material:", error);
    throw new Error("Failed to create material");
  }
}

// Material aktualisieren
export async function updateMaterial(id: string, formData: MaterialFormData) {
  try {
    return await transaction(async (client) => {
      // Zuerst die Datenbank-ID vom material_id abrufen
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

      // Material in der Datenbank aktualisieren
      await client.query(
        `
        UPDATE materials SET
          name = $1,
          category = $2,
          description = $3,
          density = $4,
          value_modifier = $5,
          impact_yield = $6,
          impact_fracture = $7,
          impact_strain_at_yield = $8,
          shear_yield = $9,
          shear_fracture = $10,
          shear_strain_at_yield = $11,
          melting_point = $12,
          boiling_point = $13,
          ignite_point = $14,
          specific_heat = $15,
          display_color = $16,
          is_metal = $17,
          is_stone = $18,
          is_gem = $19,
          is_organic = $20,
          is_fabric = $21,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $22
      `,
        [
          formData.name,
          formData.category,
          formData.description || "",
          formData.density || 0,
          formData.valueModifier || 1.0,
          formData.impactYield || 0,
          formData.impactFracture || 0,
          formData.impactStrainAtYield || 0,
          formData.shearYield || 0,
          formData.shearFracture || 0,
          formData.shearStrainAtYield || 0,
          formData.meltingPoint || null,
          formData.boilingPoint || null,
          formData.ignitePoint || null,
          formData.specificHeat || null,
          formData.displayColor || "#CCCCCC",
          formData.isMetal || false,
          formData.isStone || false,
          formData.isGem || false,
          formData.isOrganic || false,
          formData.isFabric || false,
          materialDbId,
        ]
      );

      // Bestehende zusätzliche Eigenschaften löschen
      await client.query(
        `
        DELETE FROM material_properties WHERE material_id = $1
      `,
        [materialDbId]
      );

      // Neue zusätzliche Eigenschaften einfügen
      if (
        formData.additionalProperties &&
        typeof formData.additionalProperties === "object"
      ) {
        for (const [key, value] of Object.entries(
          formData.additionalProperties
        )) {
          const valueType = typeof value;
          await client.query(
            `
            INSERT INTO material_properties (material_id, key, value, value_type)
            VALUES ($1, $2, $3, $4)
          `,
            [materialDbId, key, String(value), valueType]
          );
        }
      }

      // Seiten revalidieren
      revalidatePath(`/materials/${id}`);
      revalidatePath("/materials");

      return { success: true };
    });
  } catch (error) {
    console.error(`Error updating material with ID ${id}:`, error);
    throw new Error("Failed to update material");
  }
}

// Material löschen
export async function deleteMaterial(id: string) {
  try {
    // Zuerst die Datenbank-ID vom material_id abrufen
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

    // Die Fremdschlüsselbeziehungen löschen automatisch zugehörige Datensätze
    await mutate(
      `
      DELETE FROM materials WHERE id = $1
    `,
      [materialDbId]
    );

    // Seiten revalidieren
    revalidatePath("/materials");

    return { success: true };
  } catch (error) {
    console.error(`Error deleting material with ID ${id}:`, error);
    throw new Error("Failed to delete material");
  }
}

// Materialien nach Kategorie abrufen
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

    // Alle Materialien abrufen und nach Kategorie filtern
    const allMaterials = await getMaterials();
    return allMaterials.filter((material) => materialIds.includes(material.id));
  } catch (error) {
    console.error(`Error fetching materials of category ${category}:`, error);
    throw new Error("Failed to fetch materials by category");
  }
}
