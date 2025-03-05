// src/types/material.ts

/**
 * Kategorien für Materialien
 */
export enum MaterialCategory {
  METAL = "METAL",
  STONE = "STONE",
  WOOD = "WOOD",
  BONE = "BONE",
  LEATHER = "LEATHER",
  CLOTH = "CLOTH",
  GEM = "GEM",
  GLASS = "GLASS",
  CERAMIC = "CERAMIC",
  LIQUID = "LIQUID",
  GAS = "GAS",
  OTHER = "OTHER",
}

/**
 * Mögliche Aggregatzustände von Materialien
 */
export enum MaterialState {
  SOLID = "SOLID",
  LIQUID = "LIQUID",
  GAS = "GAS",
  POWDER = "POWDER",
  PASTE = "PASTE",
  PRESSED = "PRESSED",
}

/**
 * Hauptschnittstelle für ein Material
 * Wird für DB-Repräsentation und Anzeige verwendet
 */
export interface IMaterial {
  id: string;
  name: string;
  category: MaterialCategory;
  description: string;
  density: number; // in kg/m³
  valueModifier: number;

  // Physikalische Eigenschaften
  impactYield: number;
  impactFracture: number;
  impactStrainAtYield: number;
  shearYield: number;
  shearFracture: number;
  shearStrainAtYield: number;

  // Thermische Eigenschaften
  meltingPoint?: number;
  boilingPoint?: number;
  ignitePoint?: number;
  specificHeat?: number;

  // Visuelle Eigenschaften
  displayColor: string;

  // Kategorische Flags (für schnellere Filterung)
  isMetal: boolean;
  isStone: boolean;
  isGem: boolean;
  isOrganic: boolean;
  isFabric: boolean;

  // Zusätzliche Eigenschaften
  additionalProperties?: Record<string, string | number | boolean>;

  // Zeitstempel
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Formulardaten für Material-Erstellung/Bearbeitung
 * Verzichtet auf ID und Zeitstempel
 */
export type MaterialFormData = Omit<
  IMaterial,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * Hilfsinterface für Material-Eigenschaften
 */
export interface IMaterialProperty {
  materialId: string;
  key: string;
  value: string;
  valueType: "string" | "number" | "boolean";
}
