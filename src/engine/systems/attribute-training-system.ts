// AttributeTrainingSystem.ts
import { System, Entity } from "@/engine/ecs";
import { AttributesComponent } from "@/engine/components/attributes-component";
import { EventBus } from "@/engine/utils/event-bus";

// System to handle attribute training from various activities
export class AttributeTrainingSystem extends System {
  public componentsRequired = new Set([AttributesComponent]);
  private eventBus?: EventBus;

  // Map of activities to the attributes they train
  private static activityAttributeMap: Record<
    string,
    {
      attributes: string[];
      trainingFactor: number;
    }
  > = {
    // Physical activities
    walking: {
      attributes: ["ENDURANCE", "KINESTHETIC_SENSE"],
      trainingFactor: 0.2,
    },
    running: {
      attributes: ["STRENGTH", "AGILITY", "ENDURANCE", "KINESTHETIC_SENSE"],
      trainingFactor: 0.5,
    },
    lifting: {
      attributes: ["STRENGTH", "TOUGHNESS"],
      trainingFactor: 1.0,
    },
    carrying: {
      attributes: ["STRENGTH", "ENDURANCE"],
      trainingFactor: 0.8,
    },
    climbing: {
      attributes: ["STRENGTH", "AGILITY", "KINESTHETIC_SENSE"],
      trainingFactor: 0.9,
    },
    swimming: {
      attributes: ["STRENGTH", "AGILITY", "ENDURANCE"],
      trainingFactor: 1.0,
    },
    fighting: {
      attributes: [
        "STRENGTH",
        "AGILITY",
        "TOUGHNESS",
        "KINESTHETIC_SENSE",
        "SPATIAL_SENSE",
      ],
      trainingFactor: 1.5,
    },
    dodging: {
      attributes: ["AGILITY", "KINESTHETIC_SENSE", "SPATIAL_SENSE"],
      trainingFactor: 1.2,
    },

    // Mental activities
    studying: {
      attributes: ["ANALYTICAL_ABILITY", "FOCUS", "MEMORY"],
      trainingFactor: 1.0,
    },
    meditation: {
      attributes: ["FOCUS", "WILLPOWER"],
      trainingFactor: 1.3,
    },
    planning: {
      attributes: ["ANALYTICAL_ABILITY", "FOCUS", "SPATIAL_SENSE"],
      trainingFactor: 0.8,
    },
    crafting: {
      attributes: ["CREATIVITY", "SPATIAL_SENSE", "FOCUS", "PATIENCE"],
      trainingFactor: 1.0,
    },
    problem_solving: {
      attributes: ["ANALYTICAL_ABILITY", "MEMORY", "INTUITION"],
      trainingFactor: 1.1,
    },

    // Social activities
    conversation: {
      attributes: ["LINGUISTIC_ABILITY", "SOCIAL_AWARENESS"],
      trainingFactor: 0.7,
    },
    debating: {
      attributes: ["LINGUISTIC_ABILITY", "ANALYTICAL_ABILITY", "WILLPOWER"],
      trainingFactor: 1.2,
    },
    entertaining: {
      attributes: ["LINGUISTIC_ABILITY", "CREATIVITY", "SOCIAL_AWARENESS"],
      trainingFactor: 0.9,
    },
    comforting: {
      attributes: ["EMPATHY", "PATIENCE", "LINGUISTIC_ABILITY"],
      trainingFactor: 0.8,
    },
    negotiating: {
      attributes: ["SOCIAL_AWARENESS", "LINGUISTIC_ABILITY", "INTUITION"],
      trainingFactor: 1.0,
    },
    teaching: {
      attributes: [
        "ANALYTICAL_ABILITY",
        "LINGUISTIC_ABILITY",
        "PATIENCE",
        "EMPATHY",
      ],
      trainingFactor: 1.1,
    },
    performing: {
      attributes: ["MUSICALITY", "KINESTHETIC_SENSE", "CREATIVITY"],
      trainingFactor: 1.0,
    },
  };

  constructor(eventBus?: EventBus) {
    super();
    this.eventBus = eventBus;

    // Subscribe to activity events if eventBus provided
    if (eventBus) {
      eventBus.subscribe("activity:performed", (data) => {
        this.handleActivityPerformed(
          data.entity,
          data.activity,
          data.duration || 1
        );
      });
    }
  }

  public update(entities: Set<Entity>): void {
    // This system is primarily event-driven, not tick-based
  }

  // Train entity attributes based on activity
  public handleActivityPerformed(
    entity: Entity,
    activity: string,
    duration: number = 1
  ): void {
    try {
      const components = this.ecs.getComponents(entity);
      if (!components.has(AttributesComponent)) return;

      const attributes = components.get(AttributesComponent);
      const activityInfo =
        AttributeTrainingSystem.activityAttributeMap[activity];

      if (!activityInfo) return; // Unknown activity

      // Calculate base experience from duration and training factor
      const baseExperience = duration * activityInfo.trainingFactor;

      // Train all relevant attributes
      const improvements: string[] = [];
      for (const attrName of activityInfo.attributes) {
        // Small random variation in training effectiveness
        const expVariation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        const expPoints = baseExperience * expVariation;

        // Attempt to train the attribute
        const improved = attributes.trainAttribute(attrName, expPoints);

        // Track improvements for event emission
        if (improved) {
          improvements.push(attrName);
        }
      }

      // If any attributes improved, emit an event
      if (improvements.length > 0 && this.eventBus) {
        this.eventBus.publish("attribute:improved", {
          entity,
          attributes: improvements,
        });
      }
    } catch (error) {
      console.error(
        `Error training attributes from activity ${activity}:`,
        error
      );
    }
  }

  // Register a custom activity
  public registerActivity(
    activityName: string,
    attributes: string[],
    trainingFactor: number
  ): void {
    AttributeTrainingSystem.activityAttributeMap[activityName] = {
      attributes,
      trainingFactor,
    };
  }
}
