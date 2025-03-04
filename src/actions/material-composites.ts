// src/actions/material-composites.ts
"use server";

import { revalidatePath } from "next/cache";
import { query, mutate, transaction } from "@/lib/db";
import {
  CompositeMaterial,
  CompositeFormData,
  MaterialComponent,
  calculateWeightedAverage,
  findMinPropertyValue,
  PropertyInfluenceData,
} from "@/types/material-composite";
import { MaterialCategory, MaterialState } from "@/types/material";
import { getMaterialById } from "./materials";

// Generiert eine eindeutige ID für ein Materialverbund
function generateCompositeId(name: string): string {
  return `composite-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

// Server Action zum Abrufen aller Materialverbunde
export async function getCompositeMaterials(): Promise<CompositeMaterial[]> {
  try {
    // Get composite materials from database
    const compositeMaterials = await query<any>(`
      SELECT 
        m.id as "dbId",
        m.material_id as "id",
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
        m.is_composite as "isComposite",
        m.created_at as "createdAt",
        cm.id as "compositeId",
        cm.name as "compositeName",
        cm.description as "compositeDescription"
      FROM materials m
      JOIN composite_materials cm ON m.id = cm.composite_material_id
      WHERE m.is_composite = true
      ORDER BY m.name ASC
    `);

    // Ergebnisse mappen und Komponenten abrufen
    const result: CompositeMaterial[] = [];

    for (const material of compositeMaterials) {
      // Komponenten für das Verbundmaterial abrufen
      const components = await query<any>(
        `
        SELECT 
          cc.percentage,
          cc.is_primary as "isPrimary",
          cc.property_influence as "propertyInfluence",
          m.material_id as "materialId",
          m.name as "materialName",
          m.category as "materialCategory",
          m.color as "materialColor",
          m.color_hex as "materialColorHex"
        FROM composite_components cc
        JOIN materials m ON cc.component_material_id = m.id
        WHERE cc.composite_id = $1
      `,
        [material.compositeId]
      );

      // Eigenschaften und Zustände abrufen
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

      // Konvertieren in Maps
      const propertiesMap = new Map<string, string>();
      properties.forEach((p: any) => {
        propertiesMap.set(p.property_name, p.property_value);
      });

      const statesMap = new Map<
        MaterialState,
        { description?: string; color?: string }
      >();
      states.forEach((s: any) => {
        statesMap.set(s.state_name as MaterialState, {
          description: s.state_description,
          color: s.state_color,
        });
      });

      // Komponenten in passendes Format konvertieren
      const mappedComponents: MaterialComponent[] = components.map(
        (c: any) => ({
          material: {
            id: c.materialId,
            name: c.materialName,
            category: c.materialCategory,
            color: c.materialColor,
            colorHex: c.materialColorHex,
          },
          percentage: c.percentage,
          isPrimary: c.isPrimary,
          propertyInfluence: c.propertyInfluence,
        })
      );

      // Verbundmaterial in Ergebnisliste einfügen
      result.push({
        id: material.id,
        name: material.name,
        description: material.description || "",
        category: material.category,
        density: material.density,
        meltingPoint: material.meltingPoint,
        boilingPoint: material.boilingPoint,
        ignitePoint: material.ignitePoint,
        impactYield: material.impactYield,
        impactFracture: material.impactFracture,
        shearYield: material.shearYield,
        shearFracture: material.shearFracture,
        hardness: material.hardness,
        sharpness: material.sharpness,
        durability: material.durability,
        color: material.color,
        colorHex: material.colorHex,
        isMagical: material.isMagical,
        isRare: material.isRare,
        valueModifier: material.valueModifier,
        sourceLocation: material.sourceLocation,
        sourceCreature: material.sourceCreature,
        sourcePlant: material.sourcePlant,
        isComposite: true,
        properties: propertiesMap,
        states: statesMap,
        createdAt: new Date(material.createdAt),
        components: mappedComponents,
      });
    }

    return result;
  } catch (error) {
    console.error("Error fetching composite materials:", error);
    throw new Error("Failed to fetch composite materials");
  }
}

// Server Action zum Abrufen eines Materialverbunds anhand seiner ID
export async function getCompositeMaterialById(
  id: string
): Promise<CompositeMaterial | null> {
  try {
    // Get composite material from database
    const materials = await query<any>(
      `
      SELECT 
        m.id as "dbId",
        m.material_id as "id",
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
        m.is_composite as "isComposite",
        m.created_at as "createdAt",
        cm.id as "compositeId",
        cm.name as "compositeName",
        cm.description as "compositeDescription"
      FROM materials m
      JOIN composite_materials cm ON m.id = cm.composite_material_id
      WHERE m.material_id = $1 AND m.is_composite = true
    `,
      [id]
    );

    if (materials.length === 0) {
      return null;
    }

    const material = materials[0];

    // Komponenten abrufen
    const components = await query<any>(
      `
      SELECT 
        cc.percentage,
        cc.is_primary as "isPrimary",
        cc.property_influence as "propertyInfluence",
        m.material_id as "materialId",
        m.name as "materialName",
        m.category as "materialCategory",
        m.color as "materialColor",
        m.color_hex as "materialColorHex"
      FROM composite_components cc
      JOIN composite_materials cm ON cc.composite_id = cm.id
      JOIN materials m ON cc.component_material_id = m.id
      WHERE cm.composite_material_id = $1
    `,
      [material.dbId]
    );

    // Eigenschaften und Zustände abrufen
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

    // Konvertieren in Maps
    const propertiesMap = new Map<string, string>();
    properties.forEach((p: any) => {
      propertiesMap.set(p.property_name, p.property_value);
    });

    const statesMap = new Map<
      MaterialState,
      { description?: string; color?: string }
    >();
    states.forEach((s: any) => {
      statesMap.set(s.state_name as MaterialState, {
        description: s.state_description,
        color: s.state_color,
      });
    });

    // Komponenten in passendes Format konvertieren
    const mappedComponents: MaterialComponent[] = components.map((c: any) => ({
      material: c.materialId, // Use materialId as a reference rather than partial object
      percentage: c.percentage,
      isPrimary: c.isPrimary,
      propertyInfluence: c.propertyInfluence,
      // Include materialName, category, etc. as separate properties if needed for display
      materialName: c.materialName,
      materialCategory: c.materialCategory,
      materialColor: c.materialColor,
      materialColorHex: c.materialColorHex,
    }));

    // Verbundmaterial zurückgeben
    return {
      id: material.id,
      name: material.name,
      description: material.description || "",
      category: material.category,
      density: material.density,
      meltingPoint: material.meltingPoint,
      boilingPoint: material.boilingPoint,
      ignitePoint: material.ignitePoint,
      impactYield: material.impactYield,
      impactFracture: material.impactFracture,
      shearYield: material.shearYield,
      shearFracture: material.shearFracture,
      hardness: material.hardness,
      sharpness: material.sharpness,
      durability: material.durability,
      color: material.color,
      colorHex: material.colorHex,
      isMagical: material.isMagical,
      isRare: material.isRare,
      valueModifier: material.valueModifier,
      sourceLocation: material.sourceLocation,
      sourceCreature: material.sourceCreature,
      sourcePlant: material.sourcePlant,
      isComposite: true,
      properties: propertiesMap,
      states: statesMap,
      createdAt: new Date(material.createdAt),
      components: mappedComponents,
    };
  } catch (error) {
    console.error(`Error fetching composite material with ID ${id}:`, error);
    throw new Error("Failed to fetch composite material");
  }
}

// Helper-Funktion: Berechnet Eigenschaften für eine Legierung basierend auf ihren Komponenten
export async function calculateCompositeProperties(
  components: Array<{
    materialId: string;
    percentage: number;
    propertyInfluence?: Record<string, number>;
  }>
): Promise<{ [key: string]: number }> {
  try {
    // Komponenten-Materialien abrufen
    const fullComponents: MaterialComponent[] = [];

    for (const component of components) {
      const material = await getMaterialById(component.materialId);
      if (material) {
        fullComponents.push({
          material,
          percentage: component.percentage,
          isPrimary: false,
          propertyInfluence: component.propertyInfluence,
        });
      }
    }

    // Gewichtete Berechnung für jede Eigenschaft
    const result: { [key: string]: number } = {};

    // Hardness: gewichteter Durchschnitt
    result.hardness = calculateWeightedAverage(
      fullComponents,
      (m) => m.hardness
    );

    // Durability: gewichteter Durchschnitt
    result.durability = calculateWeightedAverage(
      fullComponents,
      (m) => m.durability
    );

    // Density: gewichteter Durchschnitt
    result.density = calculateWeightedAverage(fullComponents, (m) => m.density);

    // Sharpness: gewichteter Durchschnitt
    result.sharpness = calculateWeightedAverage(
      fullComponents,
      (m) => m.sharpness
    );

    // Value Modifier: gewichteter Durchschnitt mit 10% Bonus
    result.valueModifier =
      calculateWeightedAverage(fullComponents, (m) => m.valueModifier) * 1.1;

    // Melting Point: niedrigster Schmelzpunkt der Komponenten
    const meltingPoint = findMinPropertyValue(
      fullComponents,
      (m) => m.meltingPoint
    );
    if (meltingPoint !== undefined) {
      result.meltingPoint = meltingPoint;
    }

    // Boiling Point: niedrigster Siedepunkt der Komponenten
    const boilingPoint = findMinPropertyValue(
      fullComponents,
      (m) => m.boilingPoint
    );
    if (boilingPoint !== undefined) {
      result.boilingPoint = boilingPoint;
    }

    // Impact Yield und Fracture: gewichteter Durchschnitt
    result.impactYield = calculateWeightedAverage(
      fullComponents,
      (m) => m.impactYield
    );

    result.impactFracture = calculateWeightedAverage(
      fullComponents,
      (m) => m.impactFracture
    );

    // Shear Yield und Fracture: gewichteter Durchschnitt
    result.shearYield = calculateWeightedAverage(
      fullComponents,
      (m) => m.shearYield
    );

    result.shearFracture = calculateWeightedAverage(
      fullComponents,
      (m) => m.shearFracture
    );

    return result;
  } catch (error) {
    console.error("Error calculating composite properties:", error);
    throw new Error("Failed to calculate composite properties");
  }
}

// Server Action zum Erstellen eines neuen Materialverbunds
export async function createCompositeMaterial(
  data: CompositeFormData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    return await transaction(async (client) => {
      // Überprüfen, ob die Summe der Prozentsätze 100% ergibt
      const totalPercentage = data.components.reduce(
        (sum, c) => sum + c.percentage,
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.1) {
        return {
          success: false,
          error: `Component percentages must sum to 100% (currently: ${totalPercentage.toFixed(
            1
          )}%)`,
        };
      }

      // Eigenschaften berechnen
      const componentData = data.components.map((c) => ({
        materialId: c.materialId,
        percentage: c.percentage,
        propertyInfluence: c.propertyInfluence,
      }));

      const calculatedProperties = await calculateCompositeProperties(
        componentData
      );

      // Material-ID generieren
      const materialId = generateCompositeId(data.name);

      // Primärkomponente bestimmen (falls nicht explizit angegeben, verwende die mit dem höchsten Prozentsatz)
      if (!data.components.some((c) => c.isPrimary)) {
        const highestPercentageComponent = [...data.components].sort(
          (a, b) => b.percentage - a.percentage
        )[0];
        highestPercentageComponent.isPrimary = true;
      }

      // Primäre Materialkomponente abrufen
      const primaryComponent = data.components.find((c) => c.isPrimary);
      if (!primaryComponent) {
        return { success: false, error: "No primary component defined" };
      }

      const primaryMaterial = await getMaterialById(
        primaryComponent.materialId
      );
      if (!primaryMaterial) {
        return {
          success: false,
          error: `Primary material with ID ${primaryComponent.materialId} not found`,
        };
      }

      // Hauptmaterial erstellen (Basierend auf berechnetem Eigenschaften)
      const materialResult = await client.query(
        `INSERT INTO materials (
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
          source_plant,
          is_composite
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        RETURNING id`,
        [
          materialId,
          data.name,
          data.description,
          primaryMaterial.category, // Verwende Kategorie der Primärkomponente
          calculatedProperties.density ?? null,
          calculatedProperties.meltingPoint ?? null,
          calculatedProperties.boilingPoint ?? null,
          primaryMaterial.ignitePoint ?? null,
          calculatedProperties.impactYield ?? null,
          calculatedProperties.impactFracture ?? null,
          calculatedProperties.shearYield ?? null,
          calculatedProperties.shearFracture ?? null,
          calculatedProperties.hardness ?? 50,
          calculatedProperties.sharpness ?? 0,
          calculatedProperties.durability ?? 50,
          primaryMaterial.color, // Verwende Farbe der Primärkomponente
          primaryMaterial.colorHex ?? "#888888",
          data.components.some(async (c) => {
            const material = await getMaterialById(c.materialId);
            return material && material.isMagical;
          }) || false,
          data.components.some(async (c) => {
            const material = await getMaterialById(c.materialId);
            return material && material.isRare;
          }) || false,
          calculatedProperties.valueModifier ?? 1.0,
          null, // Kein spezieller Fundort für Verbundmaterialien
          null, // Keine Kreatur als Quelle
          null, // Keine Pflanze als Quelle
          true, // Es ist ein Verbundmaterial
        ]
      );

      const materialDbId = materialResult.rows[0].id;

      // Verbundmaterial-Eintrag erstellen
      const compositeResult = await client.query(
        `INSERT INTO composite_materials (
          composite_material_id,
          name,
          description
        ) VALUES ($1, $2, $3)
        RETURNING id`,
        [materialDbId, data.name, data.description]
      );

      const compositeId = compositeResult.rows[0].id;

      // Komponenten einfügen
      for (const component of data.components) {
        // Material-ID abrufen
        const componentMaterialResult = await client.query(
          `SELECT id FROM materials WHERE material_id = $1`,
          [component.materialId]
        );

        if (componentMaterialResult.rows.length === 0) {
          continue; // Überspringe ungültige Materialien
        }

        const componentMaterialDbId = componentMaterialResult.rows[0].id;

        // Komponente einfügen
        await client.query(
          `INSERT INTO composite_components (
            composite_id,
            component_material_id,
            percentage,
            is_primary,
            property_influence
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            compositeId,
            componentMaterialDbId,
            component.percentage,
            component.isPrimary,
            component.propertyInfluence
              ? JSON.stringify(component.propertyInfluence)
              : null,
          ]
        );
      }

      // Zustand einfügen (Standardmäßig SOLID)
      await client.query(
        `INSERT INTO material_states (
          material_id,
          state_name,
          state_description,
          state_color
        ) VALUES ($1, $2, $3, $4)`,
        [
          materialDbId,
          MaterialState.SOLID,
          `Solid ${data.name}`,
          primaryMaterial.colorHex ?? "#888888",
        ]
      );

      // Eigenschaften einfügen (Generische Eigenschaften basierend auf Komponenten)
      const isPrimaryProperty = primaryMaterial.properties.get("Primary");
      if (isPrimaryProperty) {
        await client.query(
          `INSERT INTO material_properties (
            material_id,
            property_name,
            property_value
          ) VALUES ($1, $2, $3)`,
          [materialDbId, "Primary Component", primaryMaterial.name]
        );
      }

      // Eigenschaft hinzufügen, die anzeigt, dass es sich um eine Legierung handelt
      await client.query(
        `INSERT INTO material_properties (
          material_id,
          property_name,
          property_value
        ) VALUES ($1, $2, $3)`,
        [materialDbId, "Composite Type", "Alloy"]
      );

      // Eigenschaft hinzufügen, die die Anzahl der Komponenten anzeigt
      await client.query(
        `INSERT INTO material_properties (
          material_id,
          property_name,
          property_value
        ) VALUES ($1, $2, $3)`,
        [materialDbId, "Component Count", data.components.length.toString()]
      );

      // Wege revalidieren
      revalidatePath("/materials");
      revalidatePath(`/materials/${materialId}`);
      revalidatePath("/composites");

      return { success: true, id: materialId };
    });
  } catch (error) {
    console.error("Error creating composite material:", error);
    return { success: false, error: "Failed to create composite material" };
  }
}

// Server Action zum Löschen eines Materialverbunds
export async function deleteCompositeMaterial(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Materialverbund abrufen, um sicherzustellen, dass es existiert
    const material = await getCompositeMaterialById(id);
    if (!material) {
      return {
        success: false,
        error: `Composite material with ID ${id} not found`,
      };
    }

    // Verbundmaterial löschen (kaskadiert automatisch zu anderen Tabellen)
    await mutate(
      `DELETE FROM materials WHERE material_id = $1 AND is_composite = true`,
      [id]
    );

    // Wege revalidieren
    revalidatePath("/materials");
    revalidatePath(`/materials/${id}`);
    revalidatePath("/composites");

    return { success: true };
  } catch (error) {
    console.error(`Error deleting composite material with ID ${id}:`, error);
    return { success: false, error: "Failed to delete composite material" };
  }
}
