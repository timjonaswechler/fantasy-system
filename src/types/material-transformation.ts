// src/types/material-transformation.ts
import { IMaterial } from "./material";

export enum TransformationType {
  SMELTING = "SMELTING", // Erz zu Metall
  ALLOYING = "ALLOYING", // Metalle zu Legierung
  TANNING = "TANNING", // Haut zu Leder
  CUTTING = "CUTTING", // z.B. Holz zu Planken
  GRINDING = "GRINDING", // z.B. Korn zu Mehl
  CRAFTING = "CRAFTING", // Allgemeine Verarbeitung
  MAGICAL = "MAGICAL", // Magische Transformation
}

export enum TimeUnit {
  MINUTES = "MINUTES",
  HOURS = "HOURS",
  DAYS = "DAYS",
}

export interface MaterialTransformation {
  id: string;
  sourceMaterial: string | IMaterial;
  targetMaterial: string | IMaterial;
  type: TransformationType;
  description: string;
  requiredTemperature?: number;
  yieldPercentage: number;
  requiredTool?: string;
  processingTime?: number;
  timeUnit?: TimeUnit;
  additionalRequirements?: Record<string, any>;
  createdAt?: Date;
}

export interface TransformationFormData {
  sourceMaterialId: string;
  targetMaterialId: string;
  type: TransformationType;
  description: string;
  requiredTemperature?: number;
  yieldPercentage: number;
  requiredTool?: string;
  processingTime?: number;
  timeUnit?: TimeUnit;
  additionalRequirements?: Record<string, any>;
}

export interface PerformTransformationParams {
  transformationId: string;
  quantity: number;
}

export interface TransformationResult {
  success: boolean;
  sourceMaterial?: IMaterial;
  targetMaterial?: IMaterial;
  yieldAmount?: number;
  error?: string;
}
