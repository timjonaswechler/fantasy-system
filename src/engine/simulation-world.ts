import { Entity, ECS } from "@/engine/ecs";
import { SimulationClock } from "@/engine/utils/simulation-clock";
import { EventBus } from "@/engine/utils/event-bus";
import { SpatialGrid } from "@/engine/utils/spatial-grid";
import { SerializationSystem } from "@/engine/utils/serialization-system";

// Components
import { PositionComponent } from "@/engine/components/position-component";
import { NeedsComponent } from "@/engine/components/needs-component";
import { RelationshipsComponent } from "@/engine/components/relationships-component";
import { MemoryComponent } from "@/engine/components/memory-component";
import { AttributesComponent } from "@/engine/components/attributes-component";
import { GoalsComponent } from "@/engine/components/goals-component";
import {
  PersonalityComponent,
  generateRandomPersonality,
} from "@/engine/components/personality-component";

// Systems
import { NeedSystem } from "@/engine/systems/need-system";
import { RelationshipSystem } from "@/engine/systems/relationship-system";
import { GoalSystem } from "@/engine/systems/goal-system";
import { SpatialSystem } from "@/engine/systems/spatial-system";
import { MovementSystem } from "@/engine/systems/movement-system";
import { AttributeTrainingSystem } from "@/engine/systems/attribute-training-system";
import { AttributeEffectSystem } from "@/engine/systems/attribute-system";

import {
  generateAttributes,
  AttributeRanges,
} from "@/engine/utils/attribute-definitions";

// Enhanced SimulationWorld with fully integrated attribute system
export class SimulationWorld {
  public ecs: ECS;
  public clock: SimulationClock;
  public eventBus: EventBus;
  public spatialGrid: SpatialGrid;
  public serializer: SerializationSystem;
  public attributeTrainingSystem: AttributeTrainingSystem;

  constructor() {
    this.ecs = new ECS();
    this.eventBus = new EventBus();
    this.clock = new SimulationClock(this.ecs);
    this.spatialGrid = new SpatialGrid();
    this.serializer = new SerializationSystem(this.ecs);

    // Create attribute training system
    this.attributeTrainingSystem = new AttributeTrainingSystem(this.eventBus);

    // Add core systems
    this.ecs.addSystem(new NeedSystem());
    this.ecs.addSystem(new RelationshipSystem(this.eventBus));
    this.ecs.addSystem(new GoalSystem(this.eventBus));
    this.ecs.addSystem(new SpatialSystem(this.spatialGrid));
    this.ecs.addSystem(new MovementSystem(800, 600, this.eventBus));
    this.ecs.addSystem(this.attributeTrainingSystem);
    this.ecs.addSystem(new AttributeEffectSystem());

    // Set up event listeners for simulation events
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for attribute improvements
    this.eventBus.subscribe("attribute:improved", (data) => {
      // Log attribute improvements for debugging
      console.log(
        `Entity #${data.entity} improved attributes: ${data.attributes.join(
          ", "
        )}`
      );

      // If entity has memory, record the improvement
      try {
        const components = this.ecs.getComponents(data.entity);
        if (components.has(MemoryComponent)) {
          const memory = components.get(MemoryComponent);
          if (data.attributes.length === 1) {
            memory.remember(
              `I feel my ${data.attributes[0].toLowerCase()} has improved.`,
              3
            );
          } else {
            memory.remember(`I feel I've improved in several ways.`, 2);
          }
        }
      } catch (error) {
        // Entity might not exist anymore
      }
    });

    // Listen for goal completions
    this.eventBus.subscribe("goal:completed", (data) => {
      console.log(`Entity #${data.entity} completed goal: ${data.goalId}`);
    });

    // Listen for tick events to periodically save state
    this.eventBus.subscribe("tick", (data) => {
      if (data.tickCount % 1000 === 0) {
        const state = this.serializer.saveState();
        localStorage.setItem("simulation_state", state);
      }
    });
  }

  // Start the simulation
  public start(): void {
    this.clock.start();
    console.log("Simulation started with enhanced attribute system");
  }

  // Pause the simulation
  public pause(): void {
    this.clock.pause();
  }

  // Resume the simulation
  public resume(): void {
    this.clock.resume();
  }

  // Set simulation speed
  public setSpeed(scale: number): void {
    this.clock.setTimeScale(scale);
  }

  // Create a new creature entity with DF-style attributes
  public createCreature(
    x: number,
    y: number,
    attributeValues: Record<string, number> = {}
  ): Entity {
    // Generate a complete set of DF-style attributes if not provided
    const baseAttributes = generateAttributes();

    // Override with any specifically provided values
    const fullAttributes = {
      ...baseAttributes,
      ...attributeValues,
    };

    // Create the entity
    const entity = this.ecs.addEntity();

    // Add basic components
    this.ecs.addComponent(entity, new PositionComponent(x, y));
    this.ecs.addComponent(entity, new AttributesComponent(fullAttributes));

    // Generate personality based on attributes
    const personalityTraits =
      this.generatePersonalityFromAttributes(fullAttributes);
    const personalityComponent = new PersonalityComponent(personalityTraits);
    this.ecs.addComponent(entity, personalityComponent);

    // Generate needs based on personality (which is influenced by attributes)
    const needs = personalityComponent.generateNeeds();
    this.ecs.addComponent(entity, new NeedsComponent(needs));

    // Add other components
    this.ecs.addComponent(entity, new RelationshipsComponent());
    this.ecs.addComponent(entity, new GoalsComponent());
    this.ecs.addComponent(entity, new MemoryComponent());

    // Register entity with spatial grid
    this.spatialGrid.updateEntityPosition(entity, x, y);

    // Return the entity ID
    return entity;
  }

  // Generate random creature with specific attribute tendencies
  public createRandomCreatureWithTendency(
    x: number,
    y: number,
    tendency: "physical" | "mental" | "social" | "balanced" = "balanced"
  ): Entity {
    // Generate base attributes
    const baseAttributes = generateAttributes();

    // Apply tendency modifier
    const modifiedAttributes = { ...baseAttributes };

    // Modifiers based on tendency type
    const boostAmount = 500; // Amount to boost relevant attributes
    const reducedAmount = 200; // Amount to reduce other attributes

    if (tendency === "physical") {
      // Boost physical attributes
      modifiedAttributes.STRENGTH += boostAmount;
      modifiedAttributes.AGILITY += boostAmount;
      modifiedAttributes.TOUGHNESS += boostAmount;
      modifiedAttributes.ENDURANCE += boostAmount;

      // Slightly reduce some mental attributes
      modifiedAttributes.ANALYTICAL_ABILITY -= reducedAmount;
      modifiedAttributes.CREATIVITY -= reducedAmount;
    } else if (tendency === "mental") {
      // Boost mental attributes
      modifiedAttributes.ANALYTICAL_ABILITY += boostAmount;
      modifiedAttributes.FOCUS += boostAmount;
      modifiedAttributes.CREATIVITY += boostAmount;
      modifiedAttributes.MEMORY += boostAmount;

      // Slightly reduce some physical attributes
      modifiedAttributes.STRENGTH -= reducedAmount;
      modifiedAttributes.TOUGHNESS -= reducedAmount;
    } else if (tendency === "social") {
      // Boost social attributes
      modifiedAttributes.LINGUISTIC_ABILITY += boostAmount;
      modifiedAttributes.EMPATHY += boostAmount;
      modifiedAttributes.SOCIAL_AWARENESS += boostAmount;
      modifiedAttributes.PATIENCE += boostAmount;

      // Slightly reduce some other attributes
      modifiedAttributes.STRENGTH -= reducedAmount;
      modifiedAttributes.ANALYTICAL_ABILITY -= reducedAmount;
    }
    // For "balanced", use the base attributes without modification

    // Clamp all values to valid range (0-5000)
    Object.keys(modifiedAttributes).forEach((key) => {
      modifiedAttributes[key] = Math.max(
        0,
        Math.min(5000, modifiedAttributes[key])
      );
    });

    // Create creature with the modified attributes
    return this.createCreature(x, y, modifiedAttributes);
  }

  // Get detailed entity information including attributes
  public getEntityDetails(entity: Entity): Record<string, any> | null {
    try {
      const components = this.ecs.getComponents(entity);

      // Basic details
      const details: Record<string, any> = { id: entity };

      // Add position if available
      if (components.has(PositionComponent)) {
        const position = components.get(PositionComponent);
        details.position = { x: position.x, y: position.y };
      }

      // Add attributes if available
      if (components.has(AttributesComponent)) {
        const attributesComponent = components.get(AttributesComponent);
        details.attributes = {};

        // Group attributes by category
        const physicalAttributes = [
          "STRENGTH",
          "AGILITY",
          "TOUGHNESS",
          "ENDURANCE",
          "RECUPERATION",
          "DISEASE_RESISTANCE",
        ];
        const mentalAttributes = [
          "ANALYTICAL_ABILITY",
          "FOCUS",
          "WILLPOWER",
          "CREATIVITY",
          "INTUITION",
          "PATIENCE",
          "MEMORY",
        ];
        const socialAttributes = [
          "LINGUISTIC_ABILITY",
          "SPATIAL_SENSE",
          "MUSICALITY",
          "KINESTHETIC_SENSE",
          "EMPATHY",
          "SOCIAL_AWARENESS",
        ];

        // Add physical attributes
        details.attributes.physical = {};
        for (const attr of physicalAttributes) {
          const value = attributesComponent.getAttribute(attr);
          details.attributes.physical[attr] = {
            value,
            description: attributesComponent.getAttributeDescription(attr),
          };
        }

        // Add mental attributes
        details.attributes.mental = {};
        for (const attr of mentalAttributes) {
          const value = attributesComponent.getAttribute(attr);
          details.attributes.mental[attr] = {
            value,
            description: attributesComponent.getAttributeDescription(attr),
          };
        }

        // Add social attributes
        details.attributes.social = {};
        for (const attr of socialAttributes) {
          const value = attributesComponent.getAttribute(attr);
          details.attributes.social[attr] = {
            value,
            description: attributesComponent.getAttributeDescription(attr),
          };
        }
      }

      // Add needs if available
      if (components.has(NeedsComponent)) {
        const needsComponent = components.get(NeedsComponent);
        details.needs = {
          focus: needsComponent.calculateFocus(),
          focusDescription: needsComponent.getFocusDescription(
            needsComponent.calculateFocus()
          ),
          critical: Array.from(needsComponent.getCriticalNeeds(3)).map(
            ([name, need]) => ({
              name,
              value: need.value,
              state: needsComponent.getNeedState(need.value),
            })
          ),
        };
      }

      // Add goals if available
      if (components.has(GoalsComponent)) {
        const goalsComponent = components.get(GoalsComponent);
        details.goals = goalsComponent.goals.map((goal) => ({
          id: goal.id,
          priority: goal.priority,
          progress: goal.progress,
        }));
      }

      // Add relationships if available
      if (components.has(RelationshipsComponent)) {
        const relComponent = components.get(RelationshipsComponent);
        details.relationships = Array.from(
          relComponent.relationships.entries()
        ).map(([targetId, rel]) => ({
          targetId,
          type: rel.type,
          value: rel.value,
        }));
      }

      return details;
    } catch (error) {
      console.error(`Error getting entity details for ${entity}:`, error);
      return null;
    }
  }

  /**
   * Generate personality traits influenced by attributes
   */
  private generatePersonalityFromAttributes(
    attributes: Record<string, number>
  ): Record<string, number> {
    // Start with a random personality
    const randomPersonality = generateRandomPersonality();

    // Apply attribute influences on personality traits

    // STRENGTH influences physical traits
    if (attributes.STRENGTH !== undefined) {
      const strengthInfluence = (attributes.STRENGTH - 1000) / 1000;
      randomPersonality.VIOLENT += strengthInfluence * 25;
      randomPersonality.HARD_WORK += strengthInfluence * 15;
      randomPersonality.IMMODESTY += strengthInfluence * 10;
    }

    // AGILITY influences activity-related traits
    if (attributes.AGILITY !== undefined) {
      const agilityInfluence = (attributes.AGILITY - 900) / 900;
      randomPersonality.ACTIVITY_LEVEL += agilityInfluence * 25;
      randomPersonality.EXCITEMENT_SEEKING += agilityInfluence * 20;
    }

    // ENDURANCE influences work ethic and patience
    if (attributes.ENDURANCE !== undefined) {
      const enduranceInfluence = (attributes.ENDURANCE - 1000) / 1000;
      randomPersonality.HARD_WORK += enduranceInfluence * 20;
      randomPersonality.PATIENCE += enduranceInfluence * 15;
    }

    // ANALYTICAL_ABILITY influences intellectual traits
    if (attributes.ANALYTICAL_ABILITY !== undefined) {
      const intellectInfluence = (attributes.ANALYTICAL_ABILITY - 1250) / 1250;
      randomPersonality.KNOWLEDGE += intellectInfluence * 30;
      randomPersonality.CURIOUS += intellectInfluence * 25;
      randomPersonality.ABSTRACT_INCLINED += intellectInfluence * 20;
    }

    // CREATIVITY influences artistic traits
    if (attributes.CREATIVITY !== undefined) {
      const creativityInfluence = (attributes.CREATIVITY - 1250) / 1250;
      randomPersonality.ART_INCLINED += creativityInfluence * 30;
      randomPersonality.ARTWORK += creativityInfluence * 25;
    }

    // FOCUS influences self-control traits
    if (attributes.FOCUS !== undefined) {
      const focusInfluence = (attributes.FOCUS - 1500) / 1500;
      randomPersonality["SELF-CONTROL"] += focusInfluence * 30;
      randomPersonality.IMMODERATION -= focusInfluence * 25; // Inverse relationship
    }

    // EMPATHY influences social traits
    if (attributes.EMPATHY !== undefined) {
      const empathyInfluence = (attributes.EMPATHY - 1000) / 1000;
      randomPersonality.ALTRUISM += empathyInfluence * 25;
      randomPersonality.SACRIFICE += empathyInfluence * 20;
      randomPersonality.HARMONY += empathyInfluence * 15;
    }

    // SOCIAL_AWARENESS influences relationship traits
    if (attributes.SOCIAL_AWARENESS !== undefined) {
      const socialInfluence = (attributes.SOCIAL_AWARENESS - 1000) / 1000;
      randomPersonality.FRIENDSHIP += socialInfluence * 25;
      randomPersonality.GREGARIOUSNESS += socialInfluence * 20;
    }

    // Clamp all values to valid range (0-100)
    Object.keys(randomPersonality).forEach((key) => {
      randomPersonality[key] = Math.max(
        0,
        Math.min(100, randomPersonality[key])
      );
    });

    return randomPersonality;
  }

  // Satisfy a specific need for an entity
  public satisfyEntityNeed(entity: Entity, needName: string): boolean {
    try {
      const components = this.ecs.getComponents(entity);
      if (!components.has(NeedsComponent)) return false;

      const needsComponent = components.get(NeedsComponent);

      // Satisfy the need
      if (needsComponent.satisfyNeed(needName, this.clock.getTickCount())) {
        // Create memory of satisfaction
        if (components.has(MemoryComponent)) {
          const memory = components.get(MemoryComponent);
          memory.remember(
            `My need for ${needName.toLowerCase()} has been satisfied.`,
            2
          );
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error(
        `Error satisfying need ${needName} for entity ${entity}:`,
        error
      );
      return false;
    }
  }

  // Get entity count
  public getEntityCount(): number {
    return (this.ecs as any).entities.size;
  }

  // Get a statistical summary of all attributes across entities
  public getAttributeStatistics(): Record<
    string,
    { min: number; max: number; avg: number }
  > {
    const stats: Record<
      string,
      { min: number; max: number; sum: number; count: number }
    > = {};

    // Initialize stats for all attribute types
    Object.keys(AttributeRanges).forEach((attr) => {
      stats[attr] = { min: 5000, max: 0, sum: 0, count: 0 };
    });

    // Process each entity
    for (let entityId = 0; entityId < this.getEntityCount(); entityId++) {
      try {
        const components = this.ecs.getComponents(entityId);
        if (components.has(AttributesComponent)) {
          const attrs = components.get(AttributesComponent);

          // Process each attribute
          Object.keys(AttributeRanges).forEach((attr) => {
            const value = attrs.getAttribute(attr);

            // Update statistics
            stats[attr].min = Math.min(stats[attr].min, value);
            stats[attr].max = Math.max(stats[attr].max, value);
            stats[attr].sum += value;
            stats[attr].count++;
          });
        }
      } catch (error) {
        // Entity might not exist anymore, skip
      }
    }

    // Calculate averages and return final stats
    const finalStats: Record<
      string,
      { min: number; max: number; avg: number }
    > = {};

    Object.entries(stats).forEach(([attr, data]) => {
      finalStats[attr] = {
        min: data.min === 5000 ? 0 : data.min, // If no entities had this attribute
        max: data.max,
        avg: data.count > 0 ? Math.round(data.sum / data.count) : 0,
      };
    });

    return finalStats;
  }
}
