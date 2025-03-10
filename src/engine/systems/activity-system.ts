import { System } from "@/engine/ecs";
import { Entity } from "@/engine/ecs";
import { NeedsComponent } from "@/engine/components/needs-component";
import { MemoryComponent } from "@/engine/components/memory-component";
import { PositionComponent } from "@/engine/components/position-component";
import { GoalsComponent } from "@/engine/components/goals-component";
import { EventBus } from "@/engine/utils/event-bus";

/**
 * System that detects activities that satisfy needs
 */
export class ActivitySystem extends System {
  public componentsRequired = new Set([NeedsComponent, PositionComponent]);
  private tickCount: number = 0;
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    super();
    this.eventBus = eventBus;
  }

  public update(entities: Set<Entity>): void {
    this.tickCount++;

    for (const entity of entities) {
      const components = this.ecs.getComponents(entity);

      // Process entity goals to check for need satisfaction
      if (components.has(GoalsComponent)) {
        this.processGoals(entity, components);
      }

      // Handle automatic need satisfactions based on environment or state
      this.processEnvironmentalSatisfaction(entity, components, entities);
    }
  }

  /**
   * Process goals to check if they satisfy needs
   */
  private processGoals(entity: Entity, components: any): void {
    const goalsComponent = components.get(GoalsComponent);
    const needsComponent = components.get(NeedsComponent);

    for (const goal of goalsComponent.goals) {
      // If goal is making progress or completed
      if (goal.progress > 0) {
        // Check if this goal satisfies a need
        const needName = this.getNeedFromGoal(goal.id);

        if (needName && needsComponent.needs.has(needName)) {
          // Partial satisfaction based on progress
          const satisfaction = goal.progress / 2; // Up to 50% satisfaction from progress

          // Update need value (bounded by max)
          const need = needsComponent.needs.get(needName)!;
          const oldValue = need.value;
          need.value = Math.min(need.maxValue, need.value + satisfaction);

          // If goal completed, fully satisfy the need
          if (goal.progress >= 100) {
            need.value = need.maxValue;
            need.lastFulfilled = this.tickCount;

            // Record memory of satisfaction
            if (components.has(MemoryComponent)) {
              const memory = components.get(MemoryComponent);
              memory.remember(
                `I have satisfied my need for ${needName.toLowerCase()} by completing my goal.`,
                2
              );
            }

            // Emit event if we have an event bus
            if (this.eventBus) {
              this.eventBus.publish("need:satisfied", {
                entity,
                needName,
                value: need.value,
                source: "goal",
                goalId: goal.id,
              });
            }
          }
          // If significant progress was made, record it
          else if (
            need.value - oldValue > 50 &&
            components.has(MemoryComponent)
          ) {
            const memory = components.get(MemoryComponent);
            memory.remember(
              `Making progress on ${
                goal.id
              } is helping with my ${needName.toLowerCase()} need.`,
              1
            );
          }
        }
      }
    }
  }

  /**
   * Process natural/environmental need satisfaction
   */
  private processEnvironmentalSatisfaction(
    entity: Entity,
    components: any,
    allEntities: Set<Entity>
  ): void {
    const needsComponent = components.get(NeedsComponent);
    const position = components.get(PositionComponent);

    // Check for entities nearby that could satisfy needs
    const nearbyEntities = this.getNearbyEntities(
      entity,
      position,
      allEntities
    );

    // Social needs - if other entities are nearby
    if (nearbyEntities.length > 0 && needsComponent.needs.has("SOCIALIZE")) {
      // Small satisfaction from just being near others
      const need = needsComponent.needs.get("SOCIALIZE")!;

      // Increase satisfaction based on number of nearby entities
      const satisfaction = Math.min(5, nearbyEntities.length); // Up to +5 per tick
      need.value = Math.min(need.maxValue, need.value + satisfaction);

      // Full satisfaction after sustained interaction
      if (need.value >= need.maxValue && components.has(MemoryComponent)) {
        const memory = components.get(MemoryComponent);
        memory.remember(
          `I've satisfied my need for socializing with others.`,
          1
        );
        need.lastFulfilled = this.tickCount;

        // Emit event
        if (this.eventBus) {
          this.eventBus.publish("need:satisfied", {
            entity,
            needName: "SOCIALIZE",
            value: need.value,
            source: "environment",
          });
        }
      }
    }

    // Rest need - if entity is relatively still
    if (needsComponent.needs.has("REST") && Math.random() < 0.05) {
      const need = needsComponent.needs.get("REST")!;

      // Check if entity has been moving (would be tracked in a real implementation)
      const isMoving = Math.random() < 0.3; // Simplified check

      if (!isMoving) {
        need.value = Math.min(need.maxValue, need.value + 10);

        // Full satisfaction
        if (need.value >= need.maxValue && components.has(MemoryComponent)) {
          const memory = components.get(MemoryComponent);
          memory.remember(`I've satisfied my need for rest.`, 1);
          need.lastFulfilled = this.tickCount;

          // Emit event
          if (this.eventBus) {
            this.eventBus.publish("need:satisfied", {
              entity,
              needName: "REST",
              value: need.value,
              source: "environment",
            });
          }
        }
      }
    }

    // Nature need - random chance to see animals or nature
    if (needsComponent.needs.has("NATURE") && Math.random() < 0.01) {
      const need = needsComponent.needs.get("NATURE")!;
      need.value = need.maxValue; // Fully satisfy
      need.lastFulfilled = this.tickCount;

      if (components.has(MemoryComponent)) {
        const memory = components.get(MemoryComponent);
        memory.remember(
          `I saw some wildlife and it refreshed my connection with nature.`,
          2
        );
      }

      // Emit event
      if (this.eventBus) {
        this.eventBus.publish("need:satisfied", {
          entity,
          needName: "NATURE",
          value: need.value,
          source: "environment",
        });
      }
    }
  }

  /**
   * Extract need name from goal ID
   */
  private getNeedFromGoal(goalId: string): string | null {
    // Goal IDs should follow pattern: satisfy_NEEDNAME
    if (goalId.startsWith("satisfy_")) {
      return goalId.substring(8).toUpperCase();
    }

    // Other goal naming schemes could be handled here
    return null;
  }

  /**
   * Get nearby entities
   * In a real implementation, this would use the spatial grid
   */
  private getNearbyEntities(
    entity: Entity,
    position: PositionComponent,
    allEntities: Set<Entity>
  ): Entity[] {
    const result: Entity[] = [];
    const interactionRadius = 50; // Distance for interaction

    for (const otherEntity of allEntities) {
      if (otherEntity === entity) continue;

      try {
        const components = this.ecs.getComponents(otherEntity);
        if (components.has(PositionComponent)) {
          const otherPos = components.get(PositionComponent);

          // Calculate distance
          const dx = position.x - otherPos.x;
          const dy = position.y - otherPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= interactionRadius) {
            result.push(otherEntity);
          }
        }
      } catch (error) {
        // Entity might not exist anymore
      }
    }

    return result;
  }

  /**
   * Method to directly satisfy a need (called from other systems)
   */
  public satisfyNeed(
    entity: Entity,
    needName: string,
    source: string = "direct"
  ): boolean {
    try {
      const components = this.ecs.getComponents(entity);
      if (!components.has(NeedsComponent)) return false;

      const needsComponent = components.get(NeedsComponent);
      if (needsComponent.satisfyNeed(needName, this.tickCount)) {
        // Record memory
        if (components.has(MemoryComponent)) {
          const memory = components.get(MemoryComponent);
          memory.remember(
            `I've satisfied my need for ${needName.toLowerCase()}.`,
            2
          );
        }

        // Emit event
        if (this.eventBus) {
          this.eventBus.publish("need:satisfied", {
            entity,
            needName,
            value: needsComponent.needs.get(needName)!.value,
            source,
          });
        }

        return true;
      }
    } catch (error) {
      console.error(
        `Error satisfying need ${needName} for entity ${entity}:`,
        error
      );
    }

    return false;
  }
}
