// src/types/material.ts

export enum MaterialCategory {
  METAL = "METAL",
  GEMSTONE = "GEMSTONE",
  WOOD = "WOOD",
  HIDE = "HIDE",
  FABRIC = "FABRIC",
  HERB = "herb",
  LIQUID = "liquid",
  STONE = "STONE",
  OTHER = "OTHER",
  BONE = "bone",
  GLASS = "glass",
  CLAY = "clay",
  ORGANIC = "organic",
  MAGICAL = "magical",
}

export type MaterialRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "very_rare"
  | "legendary"
  | "mythical";

// Die grundlegende Definition eines Materials im Fantasy-System

export interface IMaterial {
  id: string;
  name: string;
  description: string;
  category: MaterialCategory;
  color: string;
  properties: Map<string, string>;
  isMagical: boolean;

  // Add all the missing properties
  colorHex?: string;
  isRare?: boolean;
  isComposite?: boolean;
  density?: number;
  meltingPoint?: number;
  boilingPoint?: number;
  ignitePoint?: number;
  impactYield?: number;
  impactFracture?: number;
  shearYield?: number;
  shearFracture?: number;
  hardness?: number;
  sharpness?: number;
  durability?: number;
  valueModifier?: number;
  sourceLocation?: string;
  sourceCreature?: string;
  sourcePlant?: string;
  states: Map<MaterialState, MaterialStateData>;
}

export enum MaterialState {
  SOLID = "SOLID",
  LIQUID = "LIQUID",
  GAS = "GAS",
  POWDER = "POWDER",
  PASTE = "PASTE",
  PRESSED = "PRESSED",
  PLASMA = "PLASMA",
}

export interface MaterialStateData {
  description?: string;
  color?: string;
}

export interface MaterialFormData {
  name: string;
  description: string;
  category: MaterialCategory;

  // Physical properties
  density?: number;
  meltingPoint?: number;
  boilingPoint?: number;
  ignitePoint?: number;

  // Mechanical properties
  impactYield?: number;
  impactFracture?: number;
  shearYield?: number;
  shearFracture?: number;

  // Combat properties
  hardness?: number;
  sharpness?: number;
  durability?: number;

  // Appearance
  color: string;
  colorHex?: string;

  // Special properties
  isMagical?: boolean;
  isRare?: boolean;
  valueModifier?: number;

  // Source
  sourceLocation?: string;
  sourceCreature?: string;
  sourcePlant?: string;

  // Additional data
  properties?: { name: string; value: string }[];
  states?: {
    state: MaterialState;
    description?: string;
    color?: string;
  }[];
}

// Helper functions for material categories
export const getCategoryColor = (category: MaterialCategory): string => {
  const colors: Record<MaterialCategory, string> = {
    [MaterialCategory.METAL]: "#a5a9b4",
    [MaterialCategory.STONE]: "#8c8c8c",
    [MaterialCategory.WOOD]: "#a87d4f",
    [MaterialCategory.FABRIC]: "#e0c9a6",
    [MaterialCategory.HIDE]: "#7d4527",
    [MaterialCategory.BONE]: "#f0e6d2",
    [MaterialCategory.GLASS]: "#b5e2fa",
    [MaterialCategory.GEMSTONE]: "#5d3fd3",
    [MaterialCategory.CLAY]: "#be6e46",
    [MaterialCategory.ORGANIC]: "#7c9c65",
    [MaterialCategory.MAGICAL]: "#ff7db6",
    [MaterialCategory.LIQUID]: "#3498db",
    [MaterialCategory.HERB]: "#2ecc71",
    [MaterialCategory.OTHER]: "#888888",
  };

  return colors[category] || "#888888";
};

export const getCategoryIcon = (category: MaterialCategory): string => {
  // Returns the icon name from Lucide icons
  const icons: Record<MaterialCategory, string> = {
    [MaterialCategory.METAL]: "Sword",
    [MaterialCategory.STONE]: "MountainSnow",
    [MaterialCategory.WOOD]: "TreePine",
    [MaterialCategory.FABRIC]: "Shirt",
    [MaterialCategory.HIDE]: "Briefcase",
    [MaterialCategory.BONE]: "Skull",
    [MaterialCategory.GLASS]: "Glass",
    [MaterialCategory.GEMSTONE]: "Diamond",
    [MaterialCategory.CLAY]: "Pot",
    [MaterialCategory.ORGANIC]: "Leaf",
    [MaterialCategory.MAGICAL]: "MagicWand",
    [MaterialCategory.LIQUID]: "Droplets",
    [MaterialCategory.HERB]: "",
    [MaterialCategory.OTHER]: "",
  };

  return icons[category] || "CircleDot";
};
// Properties that all materials have and are compared for each category
export const materialBaseProperties = [
  "hardness",
  "durability",
  "density",
  "valueModifier",
  "sharpness",
];

export interface TransformationResult {
  sourceId: string;
  resultId: string;
  quantity: number;
}

export interface MaterialTransformation {
  id: string;
  name: string;
  description: string;
  sourceMaterial: string; // Material ID
  resultMaterial: string; // Material ID
  resultQuantity: number;
  temperatureRequired?: number;
  toolsRequired?: string[];
  skillRequired?: string;
  skillDC?: number;
  timeRequired?: number; // in minutes
}
