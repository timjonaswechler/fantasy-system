import { System } from "@/engine/ecs";
import { Entity } from "@/engine/ecs";
import { NeedsComponent } from "@/engine/components/needs-component";
import { AttributesComponent } from "@/engine/components/attributes-component";
import { MemoryComponent } from "@/engine/components/memory-component";
import { GoalsComponent } from "@/engine/components/goals-component";

// Enhanced Need system that handles need decay and focuses effects
export class NeedSystem extends System {
  public componentsRequired = new Set([NeedsComponent]);
  private needCriticalThreshold = -10000; // Threshold for critical need state
  private memoryTimers: Map<string, number> = new Map(); // Track last time memory was created
  private tickCount: number = 0;

  public update(entities: Set<Entity>): void {
    this.tickCount++;

    for (const entity of entities) {
      const components = this.ecs.getComponents(entity);
      const needsComponent = components.get(NeedsComponent);

      // Store previous focus for comparison
      const previousFocus = needsComponent.calculateFocus();

      // Update each need based on decay rate
      for (const [needName, need] of needsComponent.needs.entries()) {
        const oldValue = need.value;

        // Decay the need based on priority and decay rate
        // Higher priority needs decay slower
        const adjustedDecayRate =
          need.decayRate * (1 - (need.priority - 1) * 0.05);
        need.value = Math.max(-100000, need.value - adjustedDecayRate);

        // If need crosses critical threshold, handle it
        if (
          oldValue >= this.needCriticalThreshold &&
          need.value < this.needCriticalThreshold
        ) {
          this.handleCriticalNeed(entity, needName, need, components);
        }

        // Create memories for need states periodically
        this.createNeedMemories(entity, needName, need, components);
      }

      // Calculate new focus after updates
      const newFocus = needsComponent.calculateFocus();

      // Apply focus effects if changed significantly
      if (Math.abs(newFocus - previousFocus) >= 5) {
        this.applyFocusEffects(entity, newFocus, previousFocus, components);
      }

      // Generate goals based on critical needs
      this.generateNeedBasedGoals(entity, components);
    }
  }

  /**
   * Handle when a need reaches a critical state
   */
  private handleCriticalNeed(
    entity: Entity,
    needName: string,
    need: any,
    components: any
  ): void {
    // Create memory of critical need
    if (components.has(MemoryComponent)) {
      const memory = components.get(MemoryComponent);
      memory.remember(
        `My need for ${needName.toLowerCase()} has reached a critical level!`,
        3
      );
    }

    // Apply effects based on need type
    if (components.has(AttributesComponent)) {
      const attributes = components.get(AttributesComponent);

      switch (need.category) {
        case "Physical":
          // Store base attributes if not already stored
          if (!attributes.attributes.has("baseSpeed")) {
            const baseSpeed = attributes.getAttribute("speed") || 50;
            attributes.setAttribute("baseSpeed", baseSpeed);
          }

          // Reduce speed for physical needs
          const baseSpeed = attributes.getAttribute("baseSpeed");
          if (baseSpeed) {
            attributes.setAttribute("speed", baseSpeed * 0.6);
          }
          break;

        case "Mental":
          // Mental needs affect intelligence and decision-making
          if (!attributes.attributes.has("baseIntelligence")) {
            const baseIntel = attributes.getAttribute("intelligence") || 50;
            attributes.setAttribute("baseIntelligence", baseIntel);
          }

          const baseIntel = attributes.getAttribute("baseIntelligence");
          if (baseIntel) {
            attributes.setAttribute("intelligence", baseIntel * 0.7);
          }
          break;

        case "Social":
          // Social needs affect charisma
          if (!attributes.attributes.has("baseCharisma")) {
            const baseCharisma = attributes.getAttribute("charisma") || 50;
            attributes.setAttribute("baseCharisma", baseCharisma);
          }

          const baseCharisma = attributes.getAttribute("baseCharisma");
          if (baseCharisma) {
            attributes.setAttribute("charisma", baseCharisma * 0.7);
          }
          break;
      }
    }
  }

  /**
   * Apply effects based on focus change
   */
  private applyFocusEffects(
    entity: Entity,
    focus: number,
    previousFocus: number,
    components: any
  ): void {
    // Create memory of significant focus changes
    if (components.has(MemoryComponent)) {
      const memory = components.get(MemoryComponent);
      const needsComponent = components.get(NeedsComponent);

      const focusDesc = needsComponent.getFocusDescription(focus);
      const prevFocusDesc = needsComponent.getFocusDescription(previousFocus);

      if (focusDesc !== prevFocusDesc) {
        if (focus > previousFocus) {
          memory.remember(
            `I'm feeling more ${focusDesc.toLowerCase()} now.`,
            2
          );
        } else {
          memory.remember(
            `I'm feeling more ${focusDesc.toLowerCase()} now.`,
            2
          );
        }
      }
    }

    // Apply attribute modifiers based on focus
    if (components.has(AttributesComponent)) {
      const attributes = components.get(AttributesComponent);
      const needsComponent = components.get(NeedsComponent);

      // Get skill modifier based on focus (-0.5 to 0.5)
      const modifier = needsComponent.getSkillModifier(focus);

      // Store base values if not already stored
      const attrNames = ["strength", "speed", "intelligence", "charisma"];

      for (const attrName of attrNames) {
        const baseAttrName = `base${
          attrName.charAt(0).toUpperCase() + attrName.slice(1)
        }`;

        if (!attributes.attributes.has(baseAttrName)) {
          const baseValue = attributes.getAttribute(attrName) || 50;
          attributes.setAttribute(baseAttrName, baseValue);
        }

        // Apply focus modifier to attribute
        const baseValue = attributes.getAttribute(baseAttrName);
        if (baseValue) {
          const newValue = baseValue * (1 + modifier);
          attributes.setAttribute(attrName, newValue);
        }
      }
    }
  }

  /**
   * Create memories about need states
   */
  private createNeedMemories(
    entity: Entity,
    needName: string,
    need: any,
    components: any
  ): void {
    if (!components.has(MemoryComponent)) return;

    const memory = components.get(MemoryComponent);
    const memoryKey = `${entity}_${needName}`;
    const lastMemoryTick = this.memoryTimers.get(memoryKey) || 0;

    // Only create new memories periodically to avoid spam
    if (this.tickCount - lastMemoryTick < 100) return;

    // Create memories based on need state
    if (need.value < -99999) {
      memory.remember(
        `I'm desperately in need of ${needName.toLowerCase()}!`,
        3
      );
      this.memoryTimers.set(memoryKey, this.tickCount);
    } else if (need.value < -9999) {
      memory.remember(
        `My ${needName.toLowerCase()} is becoming a real problem.`,
        2
      );
      this.memoryTimers.set(memoryKey, this.tickCount);
    } else if (need.value < 0 && Math.random() < 0.2) {
      memory.remember(`I should address my ${needName.toLowerCase()} soon.`, 1);
      this.memoryTimers.set(memoryKey, this.tickCount);
    } else if (need.value > 300 && Math.random() < 0.1) {
      // Occasionally remember feelings of satisfaction
      memory.remember(
        `I feel great about my ${needName.toLowerCase()} level.`,
        1
      );
      this.memoryTimers.set(memoryKey, this.tickCount);
    }
  }

  /**
   * Generate goals based on critical needs
   */
  private generateNeedBasedGoals(entity: Entity, components: any): void {
    if (!components.has(GoalsComponent) || !components.has(NeedsComponent))
      return;

    const goalsComponent = components.get(GoalsComponent);
    const needsComponent = components.get(NeedsComponent);

    // Get most critical needs
    const criticalNeeds = needsComponent.getCriticalNeeds(2);

    for (const [needName, need] of criticalNeeds) {
      // Only create goals for significantly unsatisfied needs
      if (need.value < -5000) {
        // Create goal ID based on need
        const goalId = `satisfy_${needName.toLowerCase()}`;

        // Check if this goal already exists
        if (
          !goalsComponent.goals.some((g: { id: string }) => g.id === goalId)
        ) {
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
