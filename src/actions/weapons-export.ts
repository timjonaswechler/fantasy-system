// src/actions/weapons-export.ts
"use server";

import { getWeaponById } from "@/actions/weapons";
import { IWeapon } from "@/actions/weapons";

/**
 * Server Action to export weapons as JSON file
 * @param weaponIds Array of weapon IDs to export
 * @returns An object with the JSON string of the weapons
 */
export async function exportWeaponsAsJSON(
  weaponIds: string[]
): Promise<{ json: string; filename: string }> {
  try {
    // Fetch weapons from the database
    const weapons: IWeapon[] = [];

    for (const id of weaponIds) {
      const weapon = await getWeaponById(id);
      if (weapon) {
        weapons.push(weapon);
      }
    }

    if (weapons.length === 0) {
      throw new Error("No weapons found to export");
    }

    // Create JSON file
    const jsonData = JSON.stringify(weapons, null, 2);
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .substring(0, 19);
    const filename = `weapons_export_${timestamp}.json`;

    return {
      json: jsonData,
      filename,
    };
  } catch (error) {
    console.error("Error exporting weapons:", error);
    throw new Error("Weapons could not be exported");
  }
}
