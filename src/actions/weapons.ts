// src/actions/weapons.ts
"use server";

import { revalidatePath } from "next/cache";
import { query, mutate, transaction } from "@/lib/db";
import { WeaponType, WeaponCategory, GraspType } from "@/types/weapon";

// Define interfaces
export interface IWeapon {
  id: string;
  name: string;
  description: string;
  type: WeaponType;
  category: WeaponCategory;
  baseDamage: number[];
  weight: number[];
  price: number;
  material: string;
  durability: number;
  range?: Map<number, number>;
  grasp: GraspType[];
  properties: string[];
  imageUrl?: string;
}

export interface WeaponFormData {
  name: string;
  description: string;
  type: WeaponType;
  category: WeaponCategory;
  baseDamageMin: number;
  baseDamageMax: number;
  weightMin: number;
  weightMax: number;
  price: number;
  material: string;
  durability: number;
  properties: string[];
  grasp: GraspType[];
  imageUrl?: string;
  rangeData?: { precision: number; distance: number }[];
}

// Server Action to fetch all weapons
export async function getWeapons(): Promise<IWeapon[]> {
  try {
    // Get weapons from database
    const weapons = await query<any>(`
      SELECT 
        w.weapon_id as id, 
        w.name, 
        w.description, 
        w.type, 
        w.category, 
        w.base_damage_min, 
        w.base_damage_max, 
        w.weight_min, 
        w.weight_max, 
        w.price, 
        w.material, 
        w.durability, 
        w.properties, 
        w.image_url as "imageUrl"
      FROM weapons w
      ORDER BY w.name ASC
    `);

    // Get grasp types for each weapon
    const weaponIds = weapons.map((w) => w.id);
    const grasp = await query<any>(
      `
      SELECT wg.weapon_id, wg.grasp_type
      FROM weapon_grasp wg
      JOIN weapons w ON w.id = wg.weapon_id
      WHERE w.weapon_id = ANY($1)
    `,
      [weaponIds]
    );

    // Get range data for each weapon
    const rangeData = await query<any>(
      `
      SELECT wr.weapon_id, wr.precision_value, wr.distance
      FROM weapon_range wr
      JOIN weapons w ON w.id = wr.weapon_id
      WHERE w.weapon_id = ANY($1)
    `,
      [weaponIds]
    );

    // Map the database results to the IWeapon interface
    return weapons.map((weapon) => {
      // Convert the range data to a Map
      const rangeMap = new Map<number, number>();
      rangeData
        .filter((r) => r.weapon_id === weapon.id)
        .forEach((r) => {
          rangeMap.set(r.precision_value, r.distance);
        });

      // Convert the grasp data to an array of GraspType
      const graspArray = grasp
        .filter((g) => g.weapon_id === weapon.id)
        .map((g) => g.grasp_type);

      return {
        id: weapon.id,
        name: weapon.name,
        description: weapon.description || "",
        type: weapon.type as WeaponType,
        category: weapon.category as WeaponCategory,
        baseDamage: [weapon.base_damage_min, weapon.base_damage_max],
        weight: [weapon.weight_min, weapon.weight_max],
        price: weapon.price,
        material: weapon.material,
        durability: weapon.durability,
        properties: weapon.properties || [],
        grasp: graspArray as GraspType[],
        range: rangeMap.size > 0 ? rangeMap : undefined,
        imageUrl: weapon.imageUrl,
      };
    });
  } catch (error) {
    console.error("Error fetching weapons:", error);
    throw new Error("Failed to fetch weapons");
  }
}

// Server Action to fetch weapon by ID
export async function getWeaponById(id: string): Promise<IWeapon | null> {
  try {
    // Get weapon from database
    const weapons = await query<any>(
      `
      SELECT 
        w.id as "dbId",
        w.weapon_id as id, 
        w.name, 
        w.description, 
        w.type, 
        w.category, 
        w.base_damage_min, 
        w.base_damage_max, 
        w.weight_min, 
        w.weight_max, 
        w.price, 
        w.material, 
        w.durability, 
        w.properties, 
        w.image_url as "imageUrl"
      FROM weapons w
      WHERE w.weapon_id = $1
    `,
      [id]
    );

    if (weapons.length === 0) {
      return null;
    }

    const weapon = weapons[0];

    // Get grasp types for the weapon
    const grasp = await query<any>(
      `
      SELECT wg.grasp_type
      FROM weapon_grasp wg
      WHERE wg.weapon_id = $1
    `,
      [weapon.dbId]
    );

    // Get range data for the weapon
    const rangeData = await query<any>(
      `
      SELECT wr.precision_value, wr.distance
      FROM weapon_range wr
      WHERE wr.weapon_id = $1
    `,
      [weapon.dbId]
    );

    // Convert the range data to a Map
    const rangeMap = new Map<number, number>();
    rangeData.forEach((r) => {
      rangeMap.set(r.precision_value, r.distance);
    });

    // Convert the grasp data to an array of GraspType
    const graspArray = grasp.map((g) => g.grasp_type);

    return {
      id: weapon.id,
      name: weapon.name,
      description: weapon.description || "",
      type: weapon.type as WeaponType,
      category: weapon.category as WeaponCategory,
      baseDamage: [weapon.base_damage_min, weapon.base_damage_max],
      weight: [weapon.weight_min, weapon.weight_max],
      price: weapon.price,
      material: weapon.material,
      durability: weapon.durability,
      properties: weapon.properties || [],
      grasp: graspArray as GraspType[],
      range: rangeMap.size > 0 ? rangeMap : undefined,
      imageUrl: weapon.imageUrl,
    };
  } catch (error) {
    console.error(`Error fetching weapon with ID ${id}:`, error);
    throw new Error("Failed to fetch weapon");
  }
}

// Server Action to create a new weapon
export async function createWeapon(formData: WeaponFormData) {
  try {
    return await transaction(async (client) => {
      // Generate a unique weapon_id based on name (slug format)
      const weaponId = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Insert weapon into database
      const result = await client.query(
        `
        INSERT INTO weapons (
          weapon_id, name, description, type, category,
          base_damage_min, base_damage_max, weight_min, weight_max,
          price, material, durability, properties, image_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING id
      `,
        [
          weaponId,
          formData.name,
          formData.description,
          formData.type,
          formData.category,
          formData.baseDamageMin,
          formData.baseDamageMax,
          formData.weightMin,
          formData.weightMax,
          formData.price,
          formData.material,
          formData.durability,
          formData.properties,
          formData.imageUrl || null,
        ]
      );

      const weaponDbId = result.rows[0].id;

      // Insert grasp types
      if (formData.grasp && formData.grasp.length > 0) {
        for (const grasp of formData.grasp) {
          await client.query(
            `
            INSERT INTO weapon_grasp (weapon_id, grasp_type)
            VALUES ($1, $2)
          `,
            [weaponDbId, grasp]
          );
        }
      }

      // Insert range data if provided
      if (formData.rangeData && formData.rangeData.length > 0) {
        for (const range of formData.rangeData) {
          await client.query(
            `
            INSERT INTO weapon_range (weapon_id, precision_value, distance)
            VALUES ($1, $2, $3)
          `,
            [weaponDbId, range.precision, range.distance]
          );
        }
      }

      // Revalidate pages
      revalidatePath("/weapons");

      return { success: true, id: weaponId };
    });
  } catch (error) {
    console.error("Error creating weapon:", error);
    throw new Error("Failed to create weapon");
  }
}

// Server Action to update a weapon
export async function updateWeapon(id: string, formData: WeaponFormData) {
  try {
    return await transaction(async (client) => {
      // First get the database ID from the weapon_id
      const idResult = await client.query(
        `
        SELECT id FROM weapons WHERE weapon_id = $1
      `,
        [id]
      );

      if (idResult.rows.length === 0) {
        throw new Error(`Weapon with ID ${id} not found`);
      }

      const weaponDbId = idResult.rows[0].id;

      // Update weapon in database
      await client.query(
        `
        UPDATE weapons SET
          name = $1,
          description = $2,
          type = $3,
          category = $4,
          base_damage_min = $5,
          base_damage_max = $6,
          weight_min = $7,
          weight_max = $8,
          price = $9,
          material = $10,
          durability = $11,
          properties = $12,
          image_url = $13,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $14
      `,
        [
          formData.name,
          formData.description,
          formData.type,
          formData.category,
          formData.baseDamageMin,
          formData.baseDamageMax,
          formData.weightMin,
          formData.weightMax,
          formData.price,
          formData.material,
          formData.durability,
          formData.properties,
          formData.imageUrl || null,
          weaponDbId,
        ]
      );

      // Delete existing grasp types
      await client.query(
        `
        DELETE FROM weapon_grasp WHERE weapon_id = $1
      `,
        [weaponDbId]
      );

      // Insert new grasp types
      if (formData.grasp && formData.grasp.length > 0) {
        for (const grasp of formData.grasp) {
          await client.query(
            `
            INSERT INTO weapon_grasp (weapon_id, grasp_type)
            VALUES ($1, $2)
          `,
            [weaponDbId, grasp]
          );
        }
      }

      // Delete existing range data
      await client.query(
        `
        DELETE FROM weapon_range WHERE weapon_id = $1
      `,
        [weaponDbId]
      );

      // Insert new range data if provided
      if (formData.rangeData && formData.rangeData.length > 0) {
        for (const range of formData.rangeData) {
          await client.query(
            `
            INSERT INTO weapon_range (weapon_id, precision_value, distance)
            VALUES ($1, $2, $3)
          `,
            [weaponDbId, range.precision, range.distance]
          );
        }
      }

      // Revalidate pages
      revalidatePath(`/weapons/${id}`);
      revalidatePath("/weapons");

      return { success: true };
    });
  } catch (error) {
    console.error(`Error updating weapon with ID ${id}:`, error);
    throw new Error("Failed to update weapon");
  }
}

// Server Action to delete a weapon
export async function deleteWeapon(id: string) {
  try {
    // First get the database ID from the weapon_id
    const idResult = await query<any>(
      `
      SELECT id FROM weapons WHERE weapon_id = $1
    `,
      [id]
    );

    if (idResult.length === 0) {
      throw new Error(`Weapon with ID ${id} not found`);
    }

    const weaponDbId = idResult[0].id;

    // The foreign key constraints will automatically delete related records
    await mutate(
      `
      DELETE FROM weapons WHERE id = $1
    `,
      [weaponDbId]
    );

    // Revalidate pages
    revalidatePath("/weapons");

    return { success: true };
  } catch (error) {
    console.error(`Error deleting weapon with ID ${id}:`, error);
    throw new Error("Failed to delete weapon");
  }
}

// Server Action to get weapons by type
export async function getWeaponsByType(type: WeaponType): Promise<IWeapon[]> {
  try {
    const weaponsOfType = await query<any>(
      `
      SELECT 
        weapon_id as id 
      FROM weapons 
      WHERE type = $1
    `,
      [type]
    );

    const weaponIds = weaponsOfType.map((w) => w.id);

    // Use the existing getWeapons function and filter
    const allWeapons = await getWeapons();
    return allWeapons.filter((weapon) => weaponIds.includes(weapon.id));
  } catch (error) {
    console.error(`Error fetching weapons of type ${type}:`, error);
    throw new Error("Failed to fetch weapons by type");
  }
}

// Server Action to get weapons by category
export async function getWeaponsByCategory(
  category: WeaponCategory
): Promise<IWeapon[]> {
  try {
    const weaponsOfCategory = await query<any>(
      `
      SELECT 
        weapon_id as id 
      FROM weapons 
      WHERE category = $1
    `,
      [category]
    );

    const weaponIds = weaponsOfCategory.map((w) => w.id);

    // Use the existing getWeapons function and filter
    const allWeapons = await getWeapons();
    return allWeapons.filter((weapon) => weaponIds.includes(weapon.id));
  } catch (error) {
    console.error(`Error fetching weapons of category ${category}:`, error);
    throw new Error("Failed to fetch weapons by category");
  }
}

// Seed weapons data - for initial setup or development
export async function seedWeaponsData(weapons: WeaponFormData[]) {
  try {
    return await transaction(async (client) => {
      for (const weapon of weapons) {
        // Generate a unique weapon_id based on name (slug format)
        const weaponId = weapon.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        // Insert weapon into database
        const result = await client.query(
          `
          INSERT INTO weapons (
            weapon_id, name, description, type, category,
            base_damage_min, base_damage_max, weight_min, weight_max,
            price, material, durability, properties, image_url
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          ) RETURNING id
        `,
          [
            weaponId,
            weapon.name,
            weapon.description,
            weapon.type,
            weapon.category,
            weapon.baseDamageMin,
            weapon.baseDamageMax,
            weapon.weightMin,
            weapon.weightMax,
            weapon.price,
            weapon.material,
            weapon.durability,
            weapon.properties,
            weapon.imageUrl || null,
          ]
        );

        const weaponDbId = result.rows[0].id;

        // Insert grasp types
        if (weapon.grasp && weapon.grasp.length > 0) {
          for (const grasp of weapon.grasp) {
            await client.query(
              `
              INSERT INTO weapon_grasp (weapon_id, grasp_type)
              VALUES ($1, $2)
            `,
              [weaponDbId, grasp]
            );
          }
        }

        // Insert range data if provided
        if (weapon.rangeData && weapon.rangeData.length > 0) {
          for (const range of weapon.rangeData) {
            await client.query(
              `
              INSERT INTO weapon_range (weapon_id, precision_value, distance)
              VALUES ($1, $2, $3)
            `,
              [weaponDbId, range.precision, range.distance]
            );
          }
        }
      }

      // Revalidate pages
      revalidatePath("/weapons");

      return { success: true, count: weapons.length };
    });
  } catch (error) {
    console.error("Error seeding weapons data:", error);
    throw new Error("Failed to seed weapons data");
  }
}
