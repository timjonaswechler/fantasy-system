import { System } from "@/engine/ecs";
import { Entity } from "@/engine/ecs";
import { GoalsComponent } from "@/engine/components/goals-component";
import { AttributesComponent } from "@/engine/components/attributes-component";
import { MemoryComponent } from "@/engine/components/memory-component";
import { NeedsComponent } from "@/engine/components/needs-component";
import { EventBus } from "@/engine/utils/event-bus";

// Enhanced GoalSystem with attribute effects
export class GoalSystem extends System {
  public componentsRequired = new Set([GoalsComponent, AttributesComponent]);
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    super();
    this.eventBus = eventBus;
  }

  public update(entities: Set<Entity>): void {
    for (const entity of entities) {
      const components = this.ecs.getComponents(entity);
      const goalsComponent = components.get(GoalsComponent);
      const attributes = components.get(AttributesComponent);

      // Process existing goals
      if (goalsComponent.goals.length > 0) {
        // Sort goals by priority if needed
        goalsComponent.goals.sort((a, b) => b.priority - a.priority);

        // Work on the highest priority goal
        const topGoal = goalsComponent.goals[0];
        this.pursueGoal(entity, topGoal, components);
      } else {
        // Generate new goals based on attributes and needs
        this.considerNewGoals(entity, components);
      }
    }
  }

  // Pursue a goal with attribute-based success chances
  private pursueGoal(entity: Entity, goal: any, components: any): void {
    const attributes = components.get(AttributesComponent);

    // Calculate goal pursuit effectiveness based on relevant attributes
    let effectiveness = 1.0;

    // Different goals are affected by different attributes
    if (goal.id.includes("explore")) {
      // Exploration goals benefit from spatial sense and curiosity
      const spatialSense = attributes.getAttribute("SPATIAL_SENSE") / 1000;
      const curiosity = attributes.getAttribute("ANALYTICAL_ABILITY") / 1000;
      effectiveness = 0.5 + spatialSense * 0.3 + curiosity * 0.2;
    } else if (goal.id.includes("craft") || goal.id.includes("build")) {
      // Crafting goals benefit from creativity and spatial sense
      const creativity = attributes.getAttribute("CREATIVITY") / 1000;
      const spatialSense = attributes.getAttribute("SPATIAL_SENSE") / 1000;
      effectiveness = 0.5 + creativity * 0.3 + spatialSense * 0.2;
    } else if (goal.id.includes("socialize") || goal.id.includes("friend")) {
      // Social goals benefit from social abilities
      const linguisticAbility =
        attributes.getAttribute("LINGUISTIC_ABILITY") / 1000;
      const empathy = attributes.getAttribute("EMPATHY") / 1000;
      const socialAwareness =
        attributes.getAttribute("SOCIAL_AWARENESS") / 1000;
      effectiveness =
        0.5 + linguisticAbility * 0.2 + empathy * 0.2 + socialAwareness * 0.1;
    } else if (goal.id.includes("learn") || goal.id.includes("study")) {
      // Learning goals benefit from mental attributes
      const analyticalAbility =
        attributes.getAttribute("ANALYTICAL_ABILITY") / 1000;
      const memory = attributes.getAttribute("MEMORY") / 1000;
      const focus = attributes.getAttribute("FOCUS") / 1000;
      effectiveness =
        0.5 + analyticalAbility * 0.2 + memory * 0.2 + focus * 0.1;
    }

    // Apply focus modifier if available
    if (components.has(NeedsComponent)) {
      const needsComponent = components.get(NeedsComponent);
      const focusLevel = needsComponent.calculateFocus();

      // Lower focus reduces effectiveness
      if (focusLevel < 100) {
        effectiveness *= 0.5 + (focusLevel / 100) * 0.5; // 50% to 100% effectiveness
      }
    }

    // Apply random factor (occasional spurts of progress)
    const randomFactor = 0.5 + Math.random();

    // Calculate progress increment
    const progressIncrement = 5 * effectiveness * randomFactor;

    // Update goal progress
    goal.progress = Math.min(100, goal.progress + progressIncrement);

    // Emit activity event for attribute training
    if (this.eventBus) {
      // Determine appropriate activity type based on goal
      let activityType = "problem_solving"; // Default

      if (goal.id.includes("explore")) activityType = "walking";
      else if (goal.id.includes("craft")) activityType = "crafting";
      else if (goal.id.includes("socialize")) activityType = "conversation";
      else if (goal.id.includes("learn")) activityType = "studying";

      // Emit activity performed event
      this.eventBus.publish("activity:performed", {
        entity,
        activity: activityType,
        duration: 0.5, // Half a tick's worth (since multiple activities may happen per tick)
      });
    }

    // If goal is complete, handle completion
    if (goal.progress >= 100) {
      this.completeGoal(entity, goal, components);
    }
  }

  // Handle goal completion
  private completeGoal(entity: Entity, goal: any, components: any): void {
    const goalsComponent = components.get(GoalsComponent);

    // Remove the completed goal
    goalsComponent.removeGoal(goal.id);

    // Record memory of completion if entity has memory
    if (components.has(MemoryComponent)) {
      const memory = components.get(MemoryComponent);
      memory.remember(`Accomplished goal: ${goal.id}`, 4);
    }

    // Emit goal completion event
    if (this.eventBus) {
      this.eventBus.publish("goal:completed", {
        entity,
        goalId: goal.id,
      });
    }

    // For need-related goals, satisfy the need
    if (goal.id.startsWith("satisfy_") && components.has(NeedsComponent)) {
      const needsComponent = components.get(NeedsComponent);
      const needName = goal.id.substring(8).toUpperCase();
      needsComponent.satisfyNeed(needName, 0); // Tick parameter not used here
    }
  }

  // Consider creating new goals based on attributes and needs
  private considerNewGoals(entity: Entity, components: any): void {
    const attributes = components.get(AttributesComponent);
    const goalsComponent = components.get(GoalsComponent);

    // Get relevant attribute values
    const curiosity = attributes.getAttribute("ANALYTICAL_ABILITY") || 1000;
    const creativity = attributes.getAttribute("CREATIVITY") || 1000;
    const socialAwareness = attributes.getAttribute("SOCIAL_AWARENESS") || 1000;

    // Higher curiosity increases chance of exploration goals
    if (curiosity > 1000 && Math.random() * 2000 < curiosity) {
      if (!goalsComponent.hasGoal("explore_surroundings")) {
        goalsComponent.addGoal("explore_surroundings", 3);
      }
    }

    // Higher creativity increases chance of crafting goals
    if (creativity > 1000 && Math.random() * 2000 < creativity) {
      if (!goalsComponent.hasGoal("craft_something")) {
        goalsComponent.addGoal("craft_something", 2);
      }
    }

    // Higher social awareness increases chance of social goals
    if (socialAwareness > 1000 && Math.random() * 2000 < socialAwareness) {
      if (!goalsComponent.hasGoal("socialize")) {
        goalsComponent.addGoal("socialize", socialAwareness > 1500 ? 4 : 3);
      }
    }

    // Check for critical needs and create goals to address them
    if (components.has(NeedsComponent)) {
      const needsComponent = components.get(NeedsComponent);

      // Get most critical needs
      const criticalNeeds = needsComponent.getCriticalNeeds(2);

      for (const [needName, need] of criticalNeeds) {
        // Only create goals for significantly unsatisfied needs
        if (need.value < -5000) {
          // Create goal ID based on need
          const goalId = `satisfy_${needName.toLowerCase()}`;

          // Check if this goal already exists
          if (!goalsComponent.hasGoal(goalId)) {
            // Priority based on need priority and how critical it is
            const priority = Math.min(
              10,
              need.priority + Math.floor(-need.value / 10000)
            );

            // Add the goal
            goalsComponent.addGoal(goalId, priority);
          }
        }
      }
    }
  }
}
