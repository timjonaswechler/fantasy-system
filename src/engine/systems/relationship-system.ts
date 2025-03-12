import { System } from "@/engine/ecs";
import { Entity, ComponentContainer } from "@/engine/ecs";
import { RelationshipsComponent } from "@/engine/components/relationships-component";
import { PositionComponent } from "@/engine/components/position-component";
import { AttributesComponent } from "@/engine/components/attributes-component";
import { MemoryComponent } from "@/engine/components/memory-component";
import { EventBus } from "@/engine/utils/event-bus";

// Enhanced relationship system for social dynamics
export class RelationshipSystem extends System {
  public componentsRequired = new Set([
    RelationshipsComponent,
    PositionComponent,
  ]);
  private interactionCooldowns: Map<string, number> = new Map();
  private cooldownTicks: number = 20; // Ticks between possible interactions
  private interactionDistance: number = 40; // Distance at which entities can interact
  private eventBus?: EventBus;

  // Creates a unique key for entity interactions that is the same regardless of entity order
  private getInteractionKey = (entityA: Entity, entityB: Entity): string => {
    // Sort entity IDs to ensure consistent keys regardless of parameter order
    const id1 = String(entityA);
    const id2 = String(entityB);
    return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
  };

  constructor(eventBus?: EventBus) {
    super();
    this.eventBus = eventBus;
  }

  public update(entities: Set<Entity>): void {
    const entityArray = Array.from(entities);

    // Decrease all cooldowns
    for (const key of this.interactionCooldowns.keys()) {
      const currentValue = this.interactionCooldowns.get(key) || 0;
      if (currentValue <= 0) {
        this.interactionCooldowns.delete(key);
      } else {
        this.interactionCooldowns.set(key, currentValue - 1);
      }
    }

    // Check potential interactions between nearby entities
    for (let i = 0; i < entityArray.length; i++) {
      const entityA = entityArray[i];
      const componentsA = this.ecs.getComponents(entityA);
      const posA = componentsA.get(PositionComponent);
      const relationsA = componentsA.get(RelationshipsComponent);

      // Process each entity's relationships with other entities
      for (let j = i + 1; j < entityArray.length; j++) {
        const entityB = entityArray[j];
        const componentsB = this.ecs.getComponents(entityB);
        const posB = componentsB.get(PositionComponent);
        const relationsB = componentsB.get(RelationshipsComponent);

        // Calculate distance between entities
        const distance = Math.sqrt(
          Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2)
        );

        // If entities are close enough and not on cooldown, they may interact
        const interactionKey = this.getInteractionKey(entityA, entityB);
        if (
          distance < this.interactionDistance &&
          !this.interactionCooldowns.has(interactionKey)
        ) {
          // Put this pair on cooldown
          this.interactionCooldowns.set(interactionKey, this.cooldownTicks);

          // Process the interaction between these entities
          this.processInteraction(
            entityA,
            entityB,
            componentsA,
            componentsB,
            distance
          );
        }
      }
    }
  }

  // Process interaction between entities
  private processInteraction(
    entityA: Entity,
    entityB: Entity,
    componentsA: ComponentContainer,
    componentsB: ComponentContainer,
    distance: number
  ): void {
    // Get relationships
    const relationsA = componentsA.get(RelationshipsComponent);
    const relationsB = componentsB.get(RelationshipsComponent);

    // Get or initialize relationships
    let relationAtoB = relationsA.getRelationship(entityB);
    let relationBtoA = relationsB.getRelationship(entityA);

    // Initialize if not exist
    if (!relationAtoB) {
      relationsA.addRelationship(entityB, "neutral", 0);
      relationAtoB = relationsA.getRelationship(entityB);
    }

    if (!relationBtoA) {
      relationsB.addRelationship(entityA, "neutral", 0);
      relationBtoA = relationsB.getRelationship(entityA);
    }

    // Calculate interaction values with attribute modifiers
    let valueAtoB = (Math.random() * 2 - 1) * 2; // -2 to +2 base
    let valueBtoA = (Math.random() * 2 - 1) * 2;

    // Apply social attribute effects if entities have attributes
    if (
      componentsA.has(AttributesComponent) &&
      componentsB.has(AttributesComponent)
    ) {
      const attrsA = componentsA.get(AttributesComponent);
      const attrsB = componentsB.get(AttributesComponent);

      // Social attributes affect relationship changes
      const empathyA = attrsA.getAttribute("EMPATHY");
      const socialA = attrsA.getAttribute("SOCIAL_AWARENESS");
      const empathyB = attrsB.getAttribute("EMPATHY");
      const socialB = attrsB.getAttribute("SOCIAL_AWARENESS");

      // Calculate modifiers (higher attributes = better at forming relationships)
      const socialModA =
        ((empathyA - 1000) / 1000) * 2 + ((socialA - 1000) / 1000) * 2;
      const socialModB =
        ((empathyB - 1000) / 1000) * 2 + ((socialB - 1000) / 1000) * 2;

      // Apply to interaction values - entities with higher social skills
      // make better impressions and are more receptive to others
      valueAtoB += socialModB * 0.7 + socialModA * 0.3;
      valueBtoA += socialModA * 0.7 + socialModB * 0.3;

      // Existing relationship value influences new interactions
      // (positive relationships tend to improve, negative tend to worsen)
      valueAtoB += (relationAtoB?.value ?? 0) * 0.05;
      valueBtoA += (relationBtoA?.value ?? 0) * 0.05;
    }

    // Update relationships
    relationsA.modifyRelationship(entityB, valueAtoB);
    relationsB.modifyRelationship(entityA, valueBtoA);

    // Create memory of significant interactions
    this.recordInteractionMemory(
      entityA,
      entityB,
      componentsA,
      componentsB,
      relationAtoB?.type ?? "neutral",
      valueAtoB
    );

    // Update relationship types based on new values
    this.updateRelationshipType(relationsA, entityB);
    this.updateRelationshipType(relationsB, entityA);
  }

  private determineInitialRelationType(
    componentsA: ComponentContainer,
    componentsB: ComponentContainer
  ): string {
    // If entities have compatible attributes, they might start as friendly
    if (
      componentsA.has(AttributesComponent) &&
      componentsB.has(AttributesComponent)
    ) {
      const attrsA = componentsA.get(AttributesComponent);
      const attrsB = componentsB.get(AttributesComponent);

      // Example: Entities with similar strength might be friendly
      const strengthDiff = Math.abs(
        attrsA.getAttribute("strength") - attrsB.getAttribute("strength")
      );

      if (strengthDiff < 20) {
        return "friendly";
      } else if (strengthDiff > 50) {
        return "cautious";
      }
    }

    // Default relationship type
    return "neutral";
  }

  private calculateInteractionValue(
    entityA: Entity,
    entityB: Entity,
    componentsA: ComponentContainer,
    componentsB: ComponentContainer,
    relationAtoB: { type: string; value: number },
    relationBtoA: { type: string; value: number }
  ): { valueA: number; valueB: number } {
    // Base values - small random component to create some variance
    let valueA = (Math.random() * 2 - 1) * 2; // -2 to +2
    let valueB = (Math.random() * 2 - 1) * 2; // -2 to +2

    // Modify based on existing relationship - entities tend to reinforce their existing views
    valueA += relationAtoB.value * 0.1; // Existing positive relationships tend to improve further
    valueB += relationBtoA.value * 0.1;

    // Modify based on attributes if available
    if (
      componentsA.has(AttributesComponent) &&
      componentsB.has(AttributesComponent)
    ) {
      const attrsA = componentsA.get(AttributesComponent);
      const attrsB = componentsB.get(AttributesComponent);

      // Entities with high charisma have better interactions
      const charismaA =
        attrsA.getAttribute("charisma") ||
        attrsA.getAttribute("intelligence") ||
        50;
      const charismaB =
        attrsB.getAttribute("charisma") ||
        attrsB.getAttribute("intelligence") ||
        50;

      valueA += (charismaB - 50) / 25; // -2 to +2 based on other entity's charisma
      valueB += (charismaA - 50) / 25;
    }

    return { valueA, valueB };
  }

  private recordInteractionMemory(
    entityA: Entity,
    entityB: Entity,
    componentsA: ComponentContainer,
    componentsB: ComponentContainer,
    relationType: string,
    interactionValue: number
  ): void {
    // Only record if entity has memory component
    if (componentsA.has(MemoryComponent)) {
      const memory = componentsA.get(MemoryComponent);
      const sentiment =
        interactionValue > 0
          ? "positive"
          : interactionValue < 0
          ? "negative"
          : "neutral";

      memory.remember(
        `Interacted with Entity #${entityB} (${relationType}). It was a ${sentiment} experience.`,
        Math.abs(interactionValue) > 3 ? 3 : 1 // Higher importance for significant interactions
      );
    }

    if (componentsB.has(MemoryComponent)) {
      const memory = componentsB.get(MemoryComponent);
      const sentiment =
        interactionValue > 0
          ? "positive"
          : interactionValue < 0
          ? "negative"
          : "neutral";

      memory.remember(
        `Interacted with Entity #${entityA} (${relationType}). It was a ${sentiment} experience.`,
        Math.abs(interactionValue) > 3 ? 3 : 1
      );
    }
  }

  // Set appropriate relationship type based on value
  private updateRelationshipType(
    relationships: RelationshipsComponent,
    targetEntity: Entity
  ): void {
    const relation = relationships.getRelationship(targetEntity);
    if (!relation) return;

    // Update type based on value
    if (relation.value > 50) {
      relationships.updateRelationshipType(targetEntity, "friend");
    } else if (relation.value > 20) {
      relationships.updateRelationshipType(targetEntity, "friendly");
    } else if (relation.value < -50) {
      relationships.updateRelationshipType(targetEntity, "enemy");
    } else if (relation.value < -20) {
      relationships.updateRelationshipType(targetEntity, "hostile");
    } else {
      relationships.updateRelationshipType(targetEntity, "neutral");
    }
  }
}
