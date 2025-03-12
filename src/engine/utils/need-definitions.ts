import { NeedCategory, Need } from "@/engine/components/needs-component";

/**
 * Default values for needs
 */
export const DEFAULT_NEED_CONFIG = {
  maxValue: 400,
  value: 400, // Start fully satisfied
  decayRate: 0.1, // Default decay rate
};

/**
 * Definition of all possible needs
 */
export const NEED_DEFINITIONS: Record<
  string,
  {
    category: NeedCategory;
    description: string;
    defaultPriority: number;
    defaultDecayRate: number;
    relatedPersonalityTraits: string[];
  }
> = {
  // Social Needs
  SOCIALIZE: {
    category: "Social",
    description: "spending time with people",
    defaultPriority: 5,
    defaultDecayRate: 0.2,
    relatedPersonalityTraits: ["GREGARIOUSNESS"],
  },
  FRIENDSHIP: {
    category: "Social",
    description: "being with friends",
    defaultPriority: 3,
    defaultDecayRate: 0.15,
    relatedPersonalityTraits: ["FRIENDSHIP"],
  },
  FAMILY: {
    category: "Social",
    description: "being with family",
    defaultPriority: 4,
    defaultDecayRate: 0.15,
    relatedPersonalityTraits: ["FAMILY"],
  },
  ROMANCE: {
    category: "Social",
    description: "making romance",
    defaultPriority: 3,
    defaultDecayRate: 0.1,
    relatedPersonalityTraits: ["ROMANCE", "LOVE_PROPENSITY"],
  },
  // ELOQUENCE: {
  //   category: "Social",
  //   description: "hearing eloquent speech",
  //   defaultPriority: 2,
  //   defaultDecayRate: 0.1,
  //   relatedPersonalityTraits: ["ELOQUENCE"],
  // },
  // ARGUE: {
  //   category: "Social",
  //   description: "arguing with others",
  //   defaultPriority: 1,
  //   defaultDecayRate: 0.05,
  //   relatedPersonalityTraits: ["FRIENDLINESS", "DISCORD"],
  // },

  // // Physical Needs
  // DRINK: {
  //   category: "Physical",
  //   description: "drinking (especially alcohol)",
  //   defaultPriority: 7,
  //   defaultDecayRate: 0.3,
  //   relatedPersonalityTraits: ["IMMODERATION", "SELF-CONTROL"],
  // },
  // FOOD: {
  //   category: "Physical",
  //   description: "eating a good meal",
  //   defaultPriority: 8,
  //   defaultDecayRate: 0.25,
  //   relatedPersonalityTraits: ["IMMODERATION"],
  // },
  // REST: {
  //   category: "Physical",
  //   description: "taking it easy",
  //   defaultPriority: 7,
  //   defaultDecayRate: 0.2,
  //   relatedPersonalityTraits: ["LEISURE_TIME"],
  // },

  // // Mental Needs
  // LEARN: {
  //   category: "Mental",
  //   description: "learning something",
  //   defaultPriority: 3,
  //   defaultDecayRate: 0.1,
  //   relatedPersonalityTraits: ["KNOWLEDGE", "CURIOUS"],
  // },
  // ABSTRACT: {
  //   category: "Mental",
  //   description: "thinking abstractly",
  //   defaultPriority: 2,
  //   defaultDecayRate: 0.1,
  //   relatedPersonalityTraits: ["ABSTRACT_INCLINED"],
  // },
  // INTROSPECTION: {
  //   category: "Mental",
  //   description: "self-examination",
  //   defaultPriority: 2,
  //   defaultDecayRate: 0.1,
  //   relatedPersonalityTraits: ["INTROSPECTION"],
  // },

  // // Spiritual Needs
  // PRAY: {
  //   category: "Spiritual",
  //   description: "communing with deity/meditation",
  //   defaultPriority: 3,
  //   defaultDecayRate: 0.1,
  //   relatedPersonalityTraits: [],
  // },
  // TRADITION: {
  //   category: "Spiritual",
  //   description: "upholding tradition",
  //   defaultPriority: 2,
  //   defaultDecayRate: 0.1,
  //   relatedPersonalityTraits: ["TRADITION"],
  // },

  // // Recreational Needs
  // EXCITEMENT: {
  //   category: "Recreational",
  //   description: "doing something exciting",
  //   defaultPriority: 3,
  //   defaultDecayRate: 0.15,
  //   relatedPersonalityTraits: ["EXCITEMENT_SEEKING"],
  // },
  // MERRIMENT: {
  //   category: "Recreational",
  //   description: "making merry",
  //   defaultPriority: 3,
  //   defaultDecayRate: 0.15,
  //   relatedPersonalityTraits: ["MERRIMENT", "HUMOR"],
  // },
  // TROUBLE: {
  //   category: "Recreational",
  //   description: "causing trouble",
  //   defaultPriority: 1,
  //   defaultDecayRate: 0.05,
  //   relatedPersonalityTraits: ["HARMONY", "DISCORD"],
  // },
  // WANDER: {
  //   category: "Recreational",
  //   description: "wandering",
  //   defaultPriority: 2,
  //   defaultDecayRate: 0.1,
  //   relatedPersonalityTraits: ["NATURE", "ACTIVITY_LEVEL"],
  // },
  // BEAST: {
  //   category: "Recreational",
  //   description: "seeing a great beast",
  //   defaultPriority: 1,
  //   defaultDecayRate: 0.05,
  //   relatedPersonalityTraits: ["EXCITEMENT_SEEKING", "NATURE", "CURIOSITY"],
  // },
  // NATURE: {
  //   category: "Recreational",
  //   description: "seeing animals and nature",
  //   defaultPriority: 2,
  //   defaultDecayRate: 0.1,
  //   relatedPersonalityTraits: ["NATURE"],
  // },

  // // Emotional Needs
  // ART: {
  //   category: "Emotional",
  //   description: "admiring art",
  //   defaultPriority: 2,
  //   defaultDecayRate: 0.1,
  //   relatedPersonalityTraits: ["ARTWORK"],
  // },
  // CREATE: {
  //   category: "Emotional",
  //   description: "doing something creative",
  //   defaultPriority: 3,
  //   defaultDecayRate: 0.15,
  //   relatedPersonalityTraits: ["ART_INCLINED"],
  // },
  // EXTRAVAGANCE: {
  //   category: "Emotional",
  //   description: "being extravagant",
  //   defaultPriority: 2,
  //   defaultDecayRate: 0.1,
  //   relatedPersonalityTraits: ["IMMODESTY"],
  // },
  // ACQUIRE: {
  //   category: "Emotional",
  //   description: "acquiring something",
  //   defaultPriority: 3,
  //   defaultDecayRate: 0.1,
  //   relatedPersonalityTraits: ["GREED", "COMMERCE"],
  // },

  // // Professional Needs
  // CRAFT: {
  //   category: "Professional",
  //   description: "practicing a craft",
  //   defaultPriority: 4,
  //   defaultDecayRate: 0.15,
  //   relatedPersonalityTraits: ["CRAFTMANSHIP"],
  // },
  // SKILL: {
  //   category: "Professional",
  //   description: "practicing a skill",
  //   defaultPriority: 3,
  //   defaultDecayRate: 0.15,
  //   relatedPersonalityTraits: ["SKILL"],
  // },
  // MARTIAL: {
  //   category: "Professional",
  //   description: "practicing a martial art",
  //   defaultPriority: 3,
  //   defaultDecayRate: 0.15,
  //   relatedPersonalityTraits: ["MARTIAL_PROWESS"],
  // },
  // FIGHT: {
  //   category: "Professional",
  //   description: "fighting",
  //   defaultPriority: 2,
  //   defaultDecayRate: 0.1,
  //   relatedPersonalityTraits: ["VIOLENT"],
  // },
  // OCCUPATION: {
  //   category: "Professional",
  //   description: "staying occupied",
  //   defaultPriority: 5,
  //   defaultDecayRate: 0.2,
  //   relatedPersonalityTraits: ["HARD_WORK", "ACTIVITY_LEVEL"],
  // },
  // HELP: {
  //   category: "Professional",
  //   description: "helping somebody",
  //   defaultPriority: 2,
  //   defaultDecayRate: 0.1,
  //   relatedPersonalityTraits: ["ALTRUISM", "SACRIFICE"],
  // },
};

/**
 * Generate needs based on personality traits
 * @param personality Map of personality trait scores (0-100)
 * @returns Object with need configurations
 */
export function generateNeeds(
  personality: Map<string, number>
): Record<string, Need> {
  const needs: Record<string, Need> = {};

  // Process each need definition
  for (const [needName, needDef] of Object.entries(NEED_DEFINITIONS)) {
    // Calculate priority based on personality traits
    let priority = needDef.defaultPriority;
    let relevantTraitCount = 0;

    // Adjust priority based on relevant personality traits
    for (const trait of needDef.relatedPersonalityTraits) {
      const traitValue = personality.get(trait) || 50;
      if (traitValue > 0) {
        priority += (traitValue - 50) / 25; // -2 to +2 adjustment
        relevantTraitCount++;
      }
    }

    // Average the priority adjustments if there were any
    if (relevantTraitCount > 0) {
      priority = Math.max(1, Math.min(10, Math.round(priority)));
    }

    // If a creature has a very low value for a trait (<10), they might not have the need at all
    // Check all relevant traits to see if any are extremely low
    let skipNeed = false;
    for (const trait of needDef.relatedPersonalityTraits) {
      const traitValue = personality.get(trait) || 50;
      if (traitValue < 10) {
        // 50% chance to skip this need entirely for extremely low trait values
        if (Math.random() < 0.5) {
          skipNeed = true;
          break;
        }
      }
    }

    if (skipNeed) continue;

    // Calculate decay rate - higher priority needs should decay slightly slower
    const decayRate = needDef.defaultDecayRate * (1 - (priority - 1) * 0.05);

    // Create the need
    needs[needName] = {
      ...DEFAULT_NEED_CONFIG,
      category: needDef.category,
      priority: priority,
      decayRate: decayRate,
    };
  }

  return needs;
}
