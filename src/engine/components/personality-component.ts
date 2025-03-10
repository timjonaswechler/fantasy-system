import { Component } from "@/engine/ecs";
import { generateNeeds } from "@/engine/utils/need-definitions";
import { Need } from "@/engine/components/needs-component";

/**
 * Component that tracks personality traits which influence needs and behavior
 */
export class PersonalityComponent extends Component {
  public traits: Map<string, number> = new Map();

  constructor(traits: Record<string, number> = {}) {
    super();
    Object.entries(traits).forEach(([key, value]) => {
      // Ensure trait values are between 0-100
      this.traits.set(key, Math.max(0, Math.min(100, value)));
    });
  }

  /**
   * Get a personality trait value (0-100)
   * @param name The trait name
   * @returns Trait value or 50 if not found (neutral)
   */
  public getTrait(name: string): number {
    return this.traits.get(name) || 50;
  }

  /**
   * Set a personality trait value
   * @param name The trait name
   * @param value The trait value (0-100)
   */
  public setTrait(name: string, value: number): void {
    this.traits.set(name, Math.max(0, Math.min(100, value)));
  }

  /**
   * Modify a personality trait value
   * @param name The trait name
   * @param delta The change in value
   */
  public modifyTrait(name: string, delta: number): void {
    const current = this.getTrait(name);
    this.setTrait(name, current + delta);
  }

  /**
   * Generate needs based on personality traits
   * @returns Record of needs with configurations
   */
  public generateNeeds(): Record<string, Need> {
    return generateNeeds(this.traits);
  }

  /**
   * Get description for a trait level
   * @param name Trait name
   * @returns Text description
   */
  public getTraitDescription(name: string): string {
    const value = this.getTrait(name);

    if (value >= 90) return "Extremely high";
    if (value >= 75) return "Very high";
    if (value >= 60) return "High";
    if (value >= 40) return "Average";
    if (value >= 25) return "Low";
    if (value >= 10) return "Very low";
    return "Extremely low";
  }
}

/**
 * Default personality traits for initialization
 */
export const DEFAULT_PERSONALITY_TRAITS = [
  "GREGARIOUSNESS", // Sociability
  "FRIENDSHIP", // Values friendship
  "FAMILY", // Values family
  "ROMANCE", // Interest in romance
  "LOVE_PROPENSITY", // Romantic inclination
  "ELOQUENCE", // Appreciates eloquent speech
  "IMMODERATION", // Self-indulgent vs. restrained
  "SELF-CONTROL", // Ability to control impulses
  "KNOWLEDGE", // Interest in knowledge
  "CURIOUS", // Curiosity level
  "ABSTRACT_INCLINED", // Interest in abstract thinking
  "INTROSPECTION", // Self-reflection
  "TRADITION", // Values tradition
  "EXCITEMENT_SEEKING", // Seeks excitement
  "MERRIMENT", // Appreciates fun
  "HUMOR", // Sense of humor
  "HARMONY", // Values harmony
  "DISCORD", // Values discord/conflict
  "NATURE", // Appreciates nature
  "ARTWORK", // Appreciates art
  "ART_INCLINED", // Creative tendency
  "IMMODESTY", // Extravagance vs. modesty
  "GREED", // Material focus
  "COMMERCE", // Interest in acquisition
  "CRAFTMANSHIP", // Values craft
  "SKILL", // Values skill development
  "MARTIAL_PROWESS", // Values combat skill
  "VIOLENT", // Violent tendencies
  "HARD_WORK", // Work ethic
  "ACTIVITY_LEVEL", // Energy level
  "ALTRUISM", // Helpfulness
  "SACRIFICE", // Willingness to sacrifice
  "LEISURE_TIME", // Values relaxation
];

/**
 * Generate a random personality
 * @returns Record of personality traits
 */
export function generateRandomPersonality(): Record<string, number> {
  const traits: Record<string, number> = {};

  for (const trait of DEFAULT_PERSONALITY_TRAITS) {
    // Generate random value with normal distribution around 50
    let value = 50 + (Math.random() + Math.random() + Math.random() - 1.5) * 33;
    // Clamp between 0-100
    value = Math.max(0, Math.min(100, Math.round(value)));
    traits[trait] = value;
  }

  return traits;
}
