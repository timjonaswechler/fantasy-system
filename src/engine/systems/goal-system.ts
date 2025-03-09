import { System } from "@/engine/ecs";
import { Entity, ComponentContainer } from "@/engine/ecs";
import {
  GoalsComponent,
  AttributesComponent,
  MemoryComponent,
} from "@/engine/components/index";

// Goal-driven behavior system
export class GoalSystem extends System {
  public componentsRequired = new Set([GoalsComponent, AttributesComponent]);

  public update(entities: Set<Entity>): void {
    for (const entity of entities) {
      const components = this.ecs.getComponents(entity);
      const goalsComponent = components.get(GoalsComponent);

      // If we have goals, work on the highest priority one
      if (goalsComponent.goals.length > 0) {
        const topGoal = goalsComponent.goals[0];
        this.pursueGoal(entity, topGoal, components);
      } else {
        // Maybe generate a new goal based on needs/state
        this.considerNewGoal(entity, components);
      }
    }
  }

  private pursueGoal(
    entity: Entity,
    goal: { id: string; priority: number; progress: number },
    components: ComponentContainer
  ): void {
    // Complex goal pursuit behavior
    // For now, just increment progress randomly
    if (Math.random() < 0.1) {
      goal.progress += Math.random() * 5;

      // If goal is complete, remove it
      if (goal.progress >= 100) {
        const goalsComponent = components.get(GoalsComponent);
        goalsComponent.removeGoal(goal.id);

        // Remember goal completion
        if (components.has(MemoryComponent)) {
          const memory = components.get(MemoryComponent);
          memory.remember(`Accomplished goal: ${goal.id}`, 4);
        }
      }
    }
  }

  private considerNewGoal(
    entity: Entity,
    components: ComponentContainer
  ): void {
    // Generate goals based on needs, state, etc.
    const attributes = components.get(AttributesComponent);
    const curiosity = attributes.getAttribute("curiosity") || 0;

    // More curious entities have higher chance of creating exploration goals
    if (Math.random() * 100 < curiosity) {
      const goalsComponent = components.get(GoalsComponent);
      goalsComponent.addGoal("explore_surroundings", 2);
    }
  }
}
