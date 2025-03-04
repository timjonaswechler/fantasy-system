// src/types/weapon.ts
export enum WeaponType {
  MELEE = "MELEE",
  RANGED = "RANGED",
  THROWING = "THROWING",
}

export enum GraspType {
  ONE_HANDED = "ONE_HANDED",
  TWO_HANDED = "TWO_HANDED",
}

export enum WeaponCategory {
  // MELEE
  DAGGERS = "DAGGER",
  SWORDS = "SWORDS",
  MACES = "MACES",
  SPEARS = "SPEARS",
  AXES = "AXES",
  FLAILS = "FLAILS",
  CLEAVERS = "CLEAVERS",
  HAMMERS = "HAMMERS",
  POLEARMS = "POLEARMS",

  // RANGED
  BOWS = "BOWS",
  CROSSBOWS = "CROSSBOWS",
  FIREARMS = "FIREARMS",
  THROWING_WEAPONS = "THROWING_WEAPONS",
  THROWABLE_ITEMS = "THROWABLE_ITEMS",
}

export interface IWeapon {
  id: string;
  name: string;
  description: string;
  type: WeaponType;
  category: WeaponCategory;
  baseDamage: number[]; // e.g. [65, 85]
  weight: number[]; // min max in kg
  price: number;
  material: string;
  durability: number;
  range?: Map<number, number>; // for ranged weapons - precision to distance mapping
  grasp: GraspType[];
  properties: string[]; // special properties like "finesse", etc.
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
