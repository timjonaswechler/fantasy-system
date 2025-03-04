// src/types/material.ts

export enum MaterialCategory {
  METAL = "METAL",
  STONE = "STONE",
  WOOD = "WOOD",
  FABRIC = "FABRIC",
  LEATHER = "LEATHER",
  BONE = "BONE",
  GLASS = "GLASS",
  GEM = "GEM",
  CLAY = "CLAY",
  ORGANIC = "ORGANIC",
  MAGICAL = "MAGICAL",
  LIQUID = "LIQUID",
}

export enum MaterialState {
  SOLID = "SOLID",
  LIQUID = "LIQUID",
  GAS = "GAS",
  POWDER = "POWDER",
  PASTE = "PASTE",
  PRESSED = "PRESSED",
}

export interface IMaterial {
  id: string;
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
  isMagical: boolean;
  isRare: boolean;
  valueModifier: number;

  // Source
  sourceLocation?: string;
  sourceCreature?: string;
  sourcePlant?: string;

  // Additional data
  properties: Map<string, string>;
  states: Map<
    MaterialState,
    {
      description?: string;
      color?: string;
    }
  >;

  // Creation date
  createdAt: Date;
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
    [MaterialCategory.LEATHER]: "#7d4527",
    [MaterialCategory.BONE]: "#f0e6d2",
    [MaterialCategory.GLASS]: "#b5e2fa",
    [MaterialCategory.GEM]: "#5d3fd3",
    [MaterialCategory.CLAY]: "#be6e46",
    [MaterialCategory.ORGANIC]: "#7c9c65",
    [MaterialCategory.MAGICAL]: "#ff7db6",
    [MaterialCategory.LIQUID]: "#3498db",
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
    [MaterialCategory.LEATHER]: "Briefcase",
    [MaterialCategory.BONE]: "Bone",
    [MaterialCategory.GLASS]: "GlassWater",
    [MaterialCategory.GEM]: "Gem",
    [MaterialCategory.CLAY]: "Amphora",
    [MaterialCategory.ORGANIC]: "Sprout",
    [MaterialCategory.MAGICAL]: "WandSparkles",
    [MaterialCategory.LIQUID]: "Droplets",
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
