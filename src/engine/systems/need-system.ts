import { System } from "@/engine/ecs";
import { Entity } from "@/engine/ecs";
import { NeedsComponent } from "@/engine/components/needs-component";
import { AttributesComponent } from "@/engine/components/attributes-component";
import { MemoryComponent } from "@/engine/components/memory-component";

// Enhanced Need system that handles hunger, energy, etc.
export class NeedSystem extends System {
  public componentsRequired = new Set([NeedsComponent]);
  private needCriticalThreshold = 20; // Threshold for critical need state
  private memoryTimers: Map<string, number> = new Map(); // Track last time memory was created

  public update(entities: Set<Entity>): void {
    for (const entity of entities) {
      const components = this.ecs.getComponents(entity);
      const needsComponent = components.get(NeedsComponent);

      // Update each need based on decay rate
      for (const [needName, need] of needsComponent.needs.entries()) {
        const oldValue = need.value;
        need.value = Math.max(0, need.value - need.decayRate);

        // If need drops below critical threshold, handle it
        if (
          need.value < this.needCriticalThreshold &&
          oldValue >= this.needCriticalThreshold
        ) {
          this.handleCriticalNeed(entity, needName, need.value);
        }

        // Also if need is consistently very low, it should influence the entity
        if (need.value < this.needCriticalThreshold / 2) {
          this.applyNeedEffect(entity, needName, need.value);
        }

        // Create memories for need states
        this.createNeedMemories(entity, needName, need.value, components);
      }
    }
  }

  private handleCriticalNeed(
    entity: Entity,
    needType: string,
    value: number
  ): void {
    const components = this.ecs.getComponents(entity);

    // Add memory of critical need if entity has memory component
    if (components.has(MemoryComponent)) {
      const memory = components.get(MemoryComponent);
      memory.remember(
        `${needType} has reached critical level (${value.toFixed(1)})`,
        2
      );
    }

    // Add effects based on need type
    switch (needType) {
      case "energy":
        // Low energy affects movement speed
        if (components.has(AttributesComponent)) {
          const attrComponent = components.get(AttributesComponent);
          // Temporarily reduce speed
          const baseSpeed =
            attrComponent.getAttribute("baseSpeed") ||
            attrComponent.getAttribute("speed");

          // Store base speed if not already stored
          if (!attrComponent.attributes.has("baseSpeed") && baseSpeed) {
            attrComponent.setAttribute("baseSpeed", baseSpeed);
          }

          // Reduce speed
          if (baseSpeed) {
            attrComponent.setAttribute("speed", baseSpeed * 0.6);
          }
        }
        break;

      case "hunger":
        // Hunger affects charisma and strength
        if (components.has(AttributesComponent)) {
          const attrComponent = components.get(AttributesComponent);

          // Store base attributes if not already stored
          const baseCharisma =
            attrComponent.getAttribute("baseCharisma") ||
            attrComponent.getAttribute("charisma");
          const baseStrength =
            attrComponent.getAttribute("baseStrength") ||
            attrComponent.getAttribute("strength");

          if (!attrComponent.attributes.has("baseCharisma") && baseCharisma) {
            attrComponent.setAttribute("baseCharisma", baseCharisma);
          }

          if (!attrComponent.attributes.has("baseStrength") && baseStrength) {
            attrComponent.setAttribute("baseStrength", baseStrength);
          }

          // Reduce attributes
          if (baseCharisma) {
            attrComponent.setAttribute("charisma", baseCharisma * 0.7);
          }

          if (baseStrength) {
            attrComponent.setAttribute("strength", baseStrength * 0.8);
          }
        }
        break;
    }
  }

  private applyNeedEffect(
    entity: Entity,
    needType: string,
    value: number
  ): void {
    // Continuous effects for very low needs
    const components = this.ecs.getComponents(entity);

    if (components.has(AttributesComponent)) {
      const attrComponent = components.get(AttributesComponent);

      // Apply effects based on need type
      switch (needType) {
        case "energy":
          // Extreme fatigue can cause random pauses in movement
          if (Math.random() < 0.3) {
            // 30% chance of pausing
            // A real implementation would add a "resting" state
            // For now, we'll just slow down the entity even more
            const baseSpeed =
              attrComponent.getAttribute("baseSpeed") ||
              attrComponent.getAttribute("speed");
            if (baseSpeed) {
              attrComponent.setAttribute("speed", baseSpeed * 0.2);
            }
          }
          break;

        case "hunger":
          // Extreme hunger can lead to desperate behavior
          // For example, increasing aggression or forcing a search for food
          // In a full simulation, this would be more complex
          break;
      }
    }
  }

  private createNeedMemories(
    entity: Entity,
    needType: string,
    value: number,
    components: any
  ): void {
    if (!components.has(MemoryComponent)) return;

    const memory = components.get(MemoryComponent);
    const memoryKey = `${entity}_${needType}`;
    const currentTick = this.ecs ? (this.ecs as any).tickCount || 0 : 0;
    const lastMemoryTick = this.memoryTimers.get(memoryKey) || 0;

    // Only create new memories periodically to avoid spam
    if (currentTick - lastMemoryTick < 100) return;

    // Create memories based on need state
    if (value < this.needCriticalThreshold / 2) {
      memory.remember(`I'm desperately in need of ${needType}!`, 3);
      this.memoryTimers.set(memoryKey, currentTick);
    } else if (value < this.needCriticalThreshold) {
      memory.remember(`My ${needType} is running low.`, 1);
      this.memoryTimers.set(memoryKey, currentTick);
    } else if (value > 90 && Math.random() < 0.1) {
      // Occasionally remember feelings of satisfaction
      memory.remember(`I feel great about my ${needType} level.`, 1);
      this.memoryTimers.set(memoryKey, currentTick);
    }
  }
}
