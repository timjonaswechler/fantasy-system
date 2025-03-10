import {
  ECS,
  ComponentClass,
  ComponentContainer,
  Component,
} from "@/engine/ecs";
import { PositionComponent } from "@/engine/components/position-component";
import { AttributesComponent } from "@/engine/components/attributes-component";
import { NeedsComponent } from "@/engine/components/needs-component";
import { RelationshipsComponent } from "@/engine/components/relationships-component";
import { GoalsComponent } from "@/engine/components/goals-component";
import { MemoryComponent } from "@/engine/components/memory-component";

export class SerializationSystem {
  private ecs: ECS;

  constructor(ecs: ECS) {
    this.ecs = ecs;
  }

  public saveState(): string {
    const state: any = {
      entities: {},
      nextEntityID: (this.ecs as any).nextEntityID,
    };

    for (const [entity, components] of (this.ecs as any).entities.entries()) {
      state.entities[entity] = this.serializeComponents(components);
    }

    return JSON.stringify(state);
  }

  private serializeComponents(
    container: ComponentContainer
  ): Record<string, any> {
    const result: Record<string, any> = {};

    // This is a simplified approach; you'd need to handle custom serialization
    // for each component type in a real implementation
    for (const componentClass of this.getRegisteredComponentClasses()) {
      if (container.has(componentClass)) {
        const component = container.get(componentClass);
        result[componentClass.name] = this.serializeComponent(component);
      }
    }

    return result;
  }

  private serializeComponent(component: Component): any {
    // Simple approach: just return all properties
    return { ...component };
  }

  private getRegisteredComponentClasses(): ComponentClass<Component>[] {
    // In practice, you'd maintain a registry of component classes
    return [
      PositionComponent,
      AttributesComponent,
      NeedsComponent,
      RelationshipsComponent,
      GoalsComponent,
      MemoryComponent,
    ];
  }

  // Loading state would require a more complex implementation
  // to properly reconstruct components and their relationships
}
