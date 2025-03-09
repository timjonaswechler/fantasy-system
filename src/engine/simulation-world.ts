import { Entity, ECS } from "@/engine/ecs";
import { SimulationClock } from "@/engine/utils/simulation-clock";
import { EventBus } from "@/engine/utils/event-bus";
import { SpatialGrid } from "@/engine/utils/spatial-grid";
import { SerializationSystem } from "@/engine/utils/serialization-system";
import { PositionComponent } from "@/engine/components/position-component";
import { NeedsComponent } from "@/engine/components/needs-component";
import { RelationshipsComponent } from "@/engine/components/relationships-component";
import { MemoryComponent } from "@/engine/components/memory-component";
import { AttributesComponent } from "@/engine/components/attributes-component";
import { GoalsComponent } from "@/engine/components/goals-component";
import { NeedSystem } from "@/engine/systems/need-system";
import { RelationshipSystem } from "@/engine/systems/relationship-system";
import { GoalSystem } from "@/engine/systems/goal-system";
import { SpatialSystem } from "@/engine/systems/spatial-system";

export class SimulationWorld {
  public ecs: ECS;
  public clock: SimulationClock;
  public eventBus: EventBus;
  public spatialGrid: SpatialGrid;
  public serializer: SerializationSystem;

  constructor() {
    this.ecs = new ECS();
    this.eventBus = new EventBus();
    this.clock = new SimulationClock(this.ecs);
    this.spatialGrid = new SpatialGrid();
    this.serializer = new SerializationSystem(this.ecs);

    // Add core systems
    this.ecs.addSystem(new NeedSystem());
    this.ecs.addSystem(new RelationshipSystem());
    this.ecs.addSystem(new GoalSystem());
    this.ecs.addSystem(new SpatialSystem(this.spatialGrid));

    // Set up periodic state saving (every 1000 ticks)
    this.eventBus.subscribe("tick", (data) => {
      if (data.tickCount % 1000 === 0) {
        const state = this.serializer.saveState();
        localStorage.setItem("simulation_state", state);
      }
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

  public createCreature(
    x: number,
    y: number,
    attributes: Record<string, number>
  ): Entity {
    const entity = this.ecs.addEntity();

    // Add basic components
    this.ecs.addComponent(entity, new PositionComponent(x, y));
    this.ecs.addComponent(entity, new AttributesComponent(attributes));
    this.ecs.addComponent(
      entity,
      new NeedsComponent({
        hunger: { value: 100, maxValue: 100, decayRate: 0.1 },
        energy: { value: 100, maxValue: 100, decayRate: 0.05 },
      })
    );
    this.ecs.addComponent(entity, new RelationshipsComponent());
    this.ecs.addComponent(entity, new GoalsComponent());
    this.ecs.addComponent(entity, new MemoryComponent());

    // Add to spatial grid
    this.spatialGrid.updateEntityPosition(entity, x, y);

    return entity;
  }

  public getEntityCount(): number {
    return (this.ecs as any).entities.size;
  }
}
