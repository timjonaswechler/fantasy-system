// src/scripts/seed-weapons.ts
import { WeaponFormData } from "../types/weapon";
const { seedWeaponsData } = require("../actions/weapons");
const { WeaponType, WeaponCategory, GraspType } = require("../types/weapon");

// Import the JSON files
const axesData = require("../data/seed/weapons/axes.json");
const bowsData = require("../data/seed/weapons/bows.json");
const cleaversData = require("../data/seed/weapons/cleavers.json");
const crossbowsData = require("../data/seed/weapons/crossbows.json");
const daggersData = require("../data/seed/weapons/daggers.json");
const firearmsData = require("../data/seed/weapons/firearms.json");
const flailsData = require("../data/seed/weapons/flails.json");
const hammersData = require("../data/seed/weapons/hammers.json");
const macesData = require("../data/seed/weapons/maces.json");
const polearmsData = require("../data/seed/weapons/polearms.json");
const spearsData = require("../data/seed/weapons/spears.json");
const swordsData = require("../data/seed/weapons/swords.json");
const throwablesData = require("../data/seed/weapons/throwables.json");
const throwingWeaponsData = require("../data/seed/weapons/throwing_weapons.json");

// Convert range data format
function convertRangeData(
  rangeData: any
): { precision: number; distance: number }[] | undefined {
  if (!rangeData || !Array.isArray(rangeData) || rangeData.length === 0) {
    return undefined;
  }

  return rangeData.map(([precision, distance]) => ({
    precision,
    distance,
  }));
}

// Map JSON data to the format needed for database
function convertWeaponData(data: any[]): WeaponFormData[] {
  return data.map((weapon) => ({
    name: weapon.name,
    description: weapon.description || "",
    type: weapon.type as typeof WeaponType,
    category: weapon.category as typeof WeaponCategory,
    baseDamageMin: weapon.baseDamage ? weapon.baseDamage[0] : 0,
    baseDamageMax: weapon.baseDamage ? weapon.baseDamage[1] : 0,
    weightMin: weapon.weight ? weapon.weight[0] : 0,
    weightMax: weapon.weight ? weapon.weight[1] : 0,
    price: weapon.price || 0,
    material: weapon.material || "Stahl",
    durability: weapon.durability || 100,
    properties: weapon.properties || [],
    grasp: weapon.grasp
      ? weapon.grasp.map((g: string) => g as typeof GraspType)
      : [GraspType.ONE_HANDED],
    imageUrl: weapon.imageUrl || "",
    rangeData: convertRangeData(weapon.range),
  }));
}

async function main() {
  try {
    // Combine all weapon data
    const allWeaponsData = [
      ...convertWeaponData(axesData),
      ...convertWeaponData(bowsData),
      ...convertWeaponData(cleaversData),
      ...convertWeaponData(crossbowsData),
      ...convertWeaponData(daggersData),
      ...convertWeaponData(firearmsData),
      ...convertWeaponData(flailsData),
      ...convertWeaponData(hammersData),
      ...convertWeaponData(macesData),
      ...convertWeaponData(polearmsData),
      ...convertWeaponData(spearsData),
      ...convertWeaponData(swordsData),
      ...convertWeaponData(throwablesData),
      ...convertWeaponData(throwingWeaponsData),
    ];

    console.log(`Seeding ${allWeaponsData.length} weapons to the database...`);

    // Seed data to the database
    const result = await seedWeaponsData(allWeaponsData);

    console.log(`Seeding completed. Added ${result.count} weapons.`);
  } catch (error) {
    console.error("Error seeding weapons data:", error);
  }
}

// Execute the main function
main();
