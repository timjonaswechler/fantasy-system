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
import { ActivitySystem } from "@/engine/systems/activity-system";

export class SimulationWorld {
  public ecs: ECS;
  public clock: SimulationClock;
  public eventBus: EventBus;
  public spatialGrid: SpatialGrid;
  public serializer: SerializationSystem;
  public activitySystem: ActivitySystem;

  constructor() {
    this.ecs = new ECS();
    this.eventBus = new EventBus();
    this.clock = new SimulationClock(this.ecs);
    this.spatialGrid = new SpatialGrid();
    this.serializer = new SerializationSystem(this.ecs);

    // Create and add the activity system
    this.activitySystem = new ActivitySystem(this.eventBus);

    // Add core systems
    this.ecs.addSystem(new NeedSystem());
    this.ecs.addSystem(new RelationshipSystem(this.eventBus));
    this.ecs.addSystem(new GoalSystem());
    this.ecs.addSystem(new SpatialSystem(this.spatialGrid));
    this.ecs.addSystem(this.activitySystem);

    // Set up periodic state saving (every 1000 ticks)
    this.eventBus.subscribe("tick", (data) => {
      if (data.tickCount % 1000 === 0) {
        const state = this.serializer.saveState();
        localStorage.setItem("simulation_state", state);
      }
    });

    // Set up need tracking for debug purposes
    this.eventBus.subscribe("need:satisfied", (data) => {
      console.log(
        `Entity #${data.entity} satisfied need: ${data.needName} from ${data.source}`
      );
    });
  }

  public start(): void {
    this.clock.start();
  }

  public pause(): void {
    this.clock.pause();
  }

  public resume(): void {
    this.clock.resume();
  }

  public setSpeed(scale: number): void {
    this.clock.setTimeScale(scale);
  }

  /**
   * Create a new entity with personality and needs
   */
  public createCreature(
    x: number,
    y: number,
    attributeValues: Record<string, number> = {}
  ): Entity {
    const entity = this.ecs.addEntity();

    // Generate baseline attributes if not provided
    const defaultAttributes = {
      size: 5 + Math.random() * 10,
      strength: Math.random() * 100,
      speed: Math.random() * 100,
      intelligence: Math.random() * 100,
      charisma: Math.random() * 100,
    };

    // Merge with provided attributes
    const attributes = { ...defaultAttributes, ...attributeValues };

    // Add basic components
    this.ecs.addComponent(entity, new PositionComponent(x, y));
    this.ecs.addComponent(entity, new AttributesComponent(attributes));

    // Generate personality based on attributes
    const personality = this.generatePersonality(attributes);
    const personalityComponent = new PersonalityComponent(personality);
    this.ecs.addComponent(entity, personalityComponent);

    // Generate needs based on personality
    const needs = personalityComponent.generateNeeds();
    this.ecs.addComponent(entity, new NeedsComponent(needs));

    // Add other components
    this.ecs.addComponent(entity, new RelationshipsComponent());
    this.ecs.addComponent(entity, new GoalsComponent());
    this.ecs.addComponent(entity, new MemoryComponent());

    // Add to spatial grid
    this.spatialGrid.updateEntityPosition(entity, x, y);

    return entity;
  }

  /**
   * Generate personality traits influenced by attributes
   */
  private generatePersonality(
    attributes: Record<string, number>
  ): Record<string, number> {
    // Start with a random personality
    const randomPersonality = generateRandomPersonality();

    // Adjust traits based on attributes
    if (attributes.charisma !== undefined) {
      randomPersonality.GREGARIOUSNESS = Math.min(
        100,
        randomPersonality.GREGARIOUSNESS + (attributes.charisma - 50) / 2
      );
      randomPersonality.FRIENDSHIP = Math.min(
        100,
        randomPersonality.FRIENDSHIP + (attributes.charisma - 50) / 4
      );
      randomPersonality.ELOQUENCE = Math.min(
        100,
        randomPersonality.ELOQUENCE + (attributes.charisma - 50) / 3
      );
    }

    if (attributes.intelligence !== undefined) {
      randomPersonality.KNOWLEDGE = Math.min(
        100,
        randomPersonality.KNOWLEDGE + (attributes.intelligence - 50) / 2
      );
      randomPersonality.CURIOUS = Math.min(
        100,
        randomPersonality.CURIOUS + (attributes.intelligence - 50) / 3
      );
      randomPersonality.ABSTRACT_INCLINED = Math.min(
        100,
        randomPersonality.ABSTRACT_INCLINED + (attributes.intelligence - 50) / 2
      );
    }

    if (attributes.strength !== undefined) {
      randomPersonality.MARTIAL_PROWESS = Math.min(
        100,
        randomPersonality.MARTIAL_PROWESS + (attributes.strength - 50) / 2
      );
      randomPersonality.VIOLENT = Math.min(
        100,
        randomPersonality.VIOLENT + (attributes.strength - 50) / 5
      );
    }

    return randomPersonality;
  }

  /**
   * Satisfy a specific need for an entity
   */
  public satisfyEntityNeed(entity: Entity, needName: string): boolean {
    return this.activitySystem.satisfyNeed(entity, needName, "manual");
  }

  public getEntityCount(): number {
    return (this.ecs as any).entities.size;
  }
}
