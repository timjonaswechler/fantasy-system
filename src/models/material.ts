export interface IMaterial {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  isMagical: boolean;
  rarity: string;
  value: number;
  weight: number;
  properties: Record<string, any>;
  // Weitere erforderliche Eigenschaften...
}

export enum TransformationType {
  SMELTING = "SMELTING",
  ALLOYING = "ALLOYING",
  TANNING = "TANNING",
  CUTTING = "CUTTING",
  GRINDING = "GRINDING",
  CRAFTING = "CRAFTING",
  MAGICAL = "MAGICAL",
}

export enum TimeUnit {
  MINUTES = "MINUTES",
  HOURS = "HOURS",
  DAYS = "DAYS",
}

export interface MaterialTransformation {
  id: string | number;
  sourceMaterial: string | IMaterial;
  targetMaterial: string | IMaterial;
  type: TransformationType;
  description: string;
  requiredTemperature: number | null;
  yieldPercentage: number;
  requiredTool: string;
  processingTime: number;
  timeUnit: TimeUnit;
  additionalRequirements: Record<string, any>;
  createdAt: Date;
}
