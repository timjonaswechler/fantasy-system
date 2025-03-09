import { System } from "@/engine/ecs";
import { Entity } from "@/engine/ecs";
import { NeedsComponent, AttributesComponent } from "@/engine/components/index";

// Need system that handles hunger, energy, etc.
export class NeedSystem extends System {
  public componentsRequired = new Set([NeedsComponent]);

  public update(entities: Set<Entity>): void {
    for (const entity of entities) {
      const components = this.ecs.getComponents(entity);
      const needsComponent = components.get(NeedsComponent);

      // Update each need based on decay rate
      for (const [needName, need] of needsComponent.needs.entries()) {
        need.value = Math.max(0, need.value - need.decayRate);

        // If any need gets too low, it could affect other components
        if (need.value < 20) {
          this.handleCriticalNeed(entity, needName, need.value);
        }
      }
    }
  }

  private handleCriticalNeed(
    entity: Entity,
    needType: string,
    value: number
  ): void {
    // Example: Low energy affects movement speed
    if (needType === "energy" && value < 10) {
      const components = this.ecs.getComponents(entity);
      if (components.has(AttributesComponent)) {
        const attrComponent = components.get(AttributesComponent);
        attrComponent.setAttribute(
          "movementSpeed",
          attrComponent.getAttribute("movementSpeed") * 0.5
        );
      }
    }
  }
}
