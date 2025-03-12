import { System } from "@/engine/ecs";
import { Entity } from "@/engine/ecs";
import { PositionComponent } from "@/engine/components/position-component";
import { AttributesComponent } from "@/engine/components/attributes-component";
import { NeedsComponent } from "@/engine/components/needs-component";
import { EventBus } from "@/engine/utils/event-bus";

// Enhanced MovementSystem with attribute effects
export class MovementSystem extends System {
  public componentsRequired = new Set([PositionComponent, AttributesComponent]);
  private worldWidth: number;
  private worldHeight: number;
  private eventBus?: EventBus;

  constructor(
    worldWidth: number = 800,
    worldHeight: number = 600,
    eventBus?: EventBus
  ) {
    super();
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.eventBus = eventBus;
  }

  public update(entities: Set<Entity>): void {
    // Process movement for each entity
    for (const entity of Array.from(entities)) {
      try {
        const components = this.ecs.getComponents(entity);
        const position = components.get(PositionComponent);
        const attributes = components.get(AttributesComponent);

        // Calculate base speed from attributes (strength + agility + kinesthetic)
        const baseSpeed = this.calculateMovementSpeed(attributes);

        // Apply additional modifiers (exhaustion, encumbrance, etc.)
        const speedModifier = this.calculateSpeedModifier(components);
        const finalSpeed = baseSpeed * speedModifier;

        // Determine movement direction (from goals, relationships, etc.)
        const [dx, dy] = this.determineMovementDirection(entity, components);

        // If entity is actually moving, emit an activity event for attribute training
        if (dx !== 0 || dy !== 0) {
          // Calculate movement intensity (walking vs running)
          const intensity = Math.sqrt(dx * dx + dy * dy) * finalSpeed;
          const activity = intensity > 0.5 ? "running" : "walking";

          // Emit activity event (training system will handle attribute improvements)
          if (this.eventBus) {
            this.eventBus.publish("activity:performed", {
              entity,
              activity,
              duration: 1, // One tick of activity
            });
          }
        }

        // Update position with boundary checking
        position.x = Math.max(
          0,
          Math.min(this.worldWidth, position.x + dx * finalSpeed)
        );
        position.y = Math.max(
          0,
          Math.min(this.worldHeight, position.y + dy * finalSpeed)
        );
      } catch (error) {
        // Entity might not exist anymore, skip
      }
    }
  }

  // Calculate base movement speed from attributes
  private calculateMovementSpeed(attributes: AttributesComponent): number {
    // Base speed calculation using strength, agility, and kinesthetic sense
    const strength = attributes.getAttribute("STRENGTH");
    const agility = attributes.getAttribute("AGILITY");
    const kinesthetic = attributes.getAttribute("KINESTHETIC_SENSE");

    // Apply diminishing returns for very high attributes
    const strengthFactor = Math.min(2.0, strength / 1000);
    const agilityFactor = Math.min(2.5, agility / 800);
    const kinestheticFactor = Math.min(1.5, kinesthetic / 1200);

    // Primary factor is agility, with secondary factors from other attributes
    const baseSpeed =
      0.5 + // Base speed
      agilityFactor * 0.5 + // Agility contributes 50%
      strengthFactor * 0.3 + // Strength contributes 30%
      kinestheticFactor * 0.2; // Kinesthetic sense contributes 20%

    // Cap maximum speed
    return Math.min(3.0, baseSpeed);
  }

  // Calculate speed modifiers from various factors
  private calculateSpeedModifier(components: any): number {
    let modifier = 1.0;

    // Apply need-based modifiers if entity has needs
    if (components.has(NeedsComponent)) {
      const needs = components.get(NeedsComponent);

      // Focus level affects movement (lower focus = slower movement)
      const focus = needs.calculateFocus();
      if (focus < 80) {
        modifier *= 0.7 + (focus / 80) * 0.3; // 70% to 100% speed
      }

      // Critical physical needs slow down movement
      if (needs.needs.has("FOOD") && needs.needs.get("FOOD").value < -9000) {
        modifier *= 0.8; // 80% speed when very hungry
      }

      if (needs.needs.has("REST") && needs.needs.get("REST").value < -9000) {
        modifier *= 0.7; // 70% speed when very tired
      }
    }

    // Apply terrain modifier if available (future enhancement)

    // Ensure minimum speed
    return Math.max(0.3, modifier);
  }

  // Determine direction based on goals and relationships
  private determineMovementDirection(
    entity: Entity,
    components: any
  ): [number, number] {
    // Implementation similar to your existing movement logic, but enhanced
    // ...

    // Default to random wandering if no specific direction needed
    if (Math.random() < 0.1) {
      const angle = Math.random() * Math.PI * 2;
      return [Math.cos(angle) * 0.2, Math.sin(angle) * 0.2];
    }

    return [0, 0]; // No movement by default
  }
}
