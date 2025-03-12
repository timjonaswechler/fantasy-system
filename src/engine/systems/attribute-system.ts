import { System } from "../ecs";
import { Entity } from "../ecs";
import { AttributesComponent } from "../components/attributes-component";

// SkillEffectSystem - handles how attributes affect skill performance
export class AttributeEffectSystem extends System {
  public componentsRequired = new Set([AttributesComponent]);

  // Map of skills to their primary and secondary attributes
  private static skillAttributeMap: Record<
    string,
    {
      primary: string[];
      secondary: string[];
    }
  > = {
    // Example mappings
    Mining: {
      primary: ["STRENGTH"],
      secondary: ["TOUGHNESS", "ENDURANCE", "SPATIAL_SENSE"],
    },
    Woodcutting: {
      primary: ["STRENGTH"],
      secondary: ["AGILITY", "ENDURANCE", "SPATIAL_SENSE"],
    },
    Combat: {
      primary: ["STRENGTH", "AGILITY"],
      secondary: [
        "TOUGHNESS",
        "ENDURANCE",
        "SPATIAL_SENSE",
        "KINESTHETIC_SENSE",
      ],
    },
    Crafting: {
      primary: ["CREATIVITY", "SPATIAL_SENSE"],
      secondary: ["FOCUS", "PATIENCE"],
    },
    Social: {
      primary: ["LINGUISTIC_ABILITY", "EMPATHY"],
      secondary: ["SOCIAL_AWARENESS"],
    },
    // Add more skill mappings
  };

  public update(entities: Set<Entity>): void {
    // This system doesn't need to run every tick
    // It could be called on-demand when calculating skill effectiveness
  }

  // Calculate skill performance multiplier based on attributes
  public calculateSkillMultiplier(entity: Entity, skillName: string): number {
    const components = this.ecs.getComponents(entity);
    if (!components.has(AttributesComponent)) return 1.0;

    const attributes = components.get(AttributesComponent);
    const mapping = AttributeEffectSystem.skillAttributeMap[skillName];

    if (!mapping) return 1.0; // No attribute mapping for this skill

    let multiplier = 1.0;

    // Primary attributes give 1% bonus per 100 points above 1000
    for (const attrName of mapping.primary) {
      const value = attributes.getAttribute(attrName);
      multiplier += ((value - 1000) / 100) * 0.01;
    }

    // Secondary attributes give 1% bonus per 250 points above 1000
    for (const attrName of mapping.secondary) {
      const value = attributes.getAttribute(attrName);
      multiplier += ((value - 1000) / 250) * 0.01;
    }

    // Ensure we don't go below 0.5x or above 3x
    return Math.max(0.5, Math.min(3.0, multiplier));
  }

  // Train attributes based on skill usage
  public trainAttributesFromSkill(
    entity: Entity,
    skillName: string,
    experience: number
  ): void {
    const components = this.ecs.getComponents(entity);
    if (!components.has(AttributesComponent)) return;

    const attributes = components.get(AttributesComponent);
    const mapping = AttributeEffectSystem.skillAttributeMap[skillName];

    if (!mapping) return; // No attribute mapping for this skill

    // Primary attributes get more training
    for (const attrName of mapping.primary) {
      attributes.trainAttribute(attrName, experience);
    }

    // Secondary attributes get less training
    for (const attrName of mapping.secondary) {
      attributes.trainAttribute(attrName, experience * 0.4);
    }
  }
}
