// src/actions/materials-export.ts
"use server";

import { getMaterialById } from "@/actions/materials";
import { IMaterial } from "@/types/material";

/**
 * Server Action zum Exportieren von Materialien als JSON-Datei
 * @param materialIds Array von Material-IDs, die exportiert werden sollen
 * @returns Ein Objekt mit dem JSON-String der Materialien
 */
export async function exportMaterialsAsJSON(
  materialIds: string[]
): Promise<{ json: string; filename: string }> {
  try {
    // Materialien aus der Datenbank abrufen
    const materials: IMaterial[] = [];

    for (const id of materialIds) {
      const material = await getMaterialById(id);
      if (material) {
        materials.push(material);
      }
    }

    if (materials.length === 0) {
      throw new Error("Keine Materialien zum Exportieren gefunden");
    }

    // JSON-Datei erstellen
    const jsonData = JSON.stringify(materials, null, 2);
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .substring(0, 19);
    const filename = `materialien_export_${timestamp}.json`;

    return {
      json: jsonData,
      filename,
    };
  } catch (error) {
    console.error("Fehler beim Exportieren der Materialien:", error);
    throw new Error("Materialien konnten nicht exportiert werden");
  }
}
