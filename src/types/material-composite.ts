// src/types/material-composite.ts
import { IMaterial } from "./material";

export interface MaterialComponent {
  material: string | IMaterial;
  percentage: number;
  isPrimary: boolean;
  propertyInfluence?: Record<string, number>; // Multiplikatoren für Eigenschaften
}

export interface CompositeMaterial extends IMaterial {
  isComposite: true;
  components: MaterialComponent[];
}

export interface CompositeFormData {
  name: string;
  description: string;
  components: {
    materialId: string;
    percentage: number;
    isPrimary: boolean;
    propertyInfluence?: Record<string, number>;
  }[];
}

export interface PropertyInfluenceData {
  hardness?: number;
  durability?: number;
  density?: number;
  sharpness?: number;
  valueModifier?: number;
  // Weitere Eigenschaften...
}

// Helper-Funktionen für Legierungsberechnungen

/**
 * Berechnet den gewichteten Durchschnitt einer numerischen Eigenschaft für eine Legierung
 */
export function calculateWeightedAverage(
  components: MaterialComponent[],
  propertyGetter: (material: IMaterial) => number | undefined
): number {
  let totalValue = 0;
  let totalWeight = 0;

  for (const component of components) {
    // Skip if material is just a string ID
    if (typeof component.material === "string") continue;

    const material = component.material as IMaterial;
    const value = propertyGetter(material);

    if (typeof value === "number") {
      const influence = component.propertyInfluence?.[propertyGetter.name] || 1;
      totalValue += value * (component.percentage / 100) * influence;
      totalWeight += component.percentage / 100;
    }
  }

  return totalWeight > 0 ? totalValue / totalWeight : 0;
}

/**
 * Findet den Minimalwert einer numerischen Eigenschaft unter allen Komponenten
 */
export function findMinPropertyValue(
  components: MaterialComponent[],
  propertyGetter: (material: IMaterial) => number | undefined
): number | undefined {
  const values: number[] = [];

  for (const component of components) {
    if (typeof component.material === "string") continue;

    const material = component.material as IMaterial;
    const value = propertyGetter(material);

    if (typeof value === "number") {
      values.push(value);
    }
  }

  return values.length > 0 ? Math.min(...values) : undefined;
}

/**
 * Findet den Maximalwert einer numerischen Eigenschaft unter allen Komponenten
 */
export function findMaxPropertyValue(
  components: MaterialComponent[],
  propertyGetter: (material: IMaterial) => number | undefined
): number | undefined {
  const values: number[] = [];

  for (const component of components) {
    if (typeof component.material === "string") continue;

    const material = component.material as IMaterial;
    const value = propertyGetter(material);

    if (typeof value === "number") {
      values.push(value);
    }
  }

  return values.length > 0 ? Math.max(...values) : undefined;
}
