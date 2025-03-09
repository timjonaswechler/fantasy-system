import { System } from "@/engine/ecs";
import { Entity } from "@/engine/ecs";
import {
  RelationshipsComponent,
  PositionComponent,
} from "@/engine/components/index";

// Relationship system for social dynamics
export class RelationshipSystem extends System {
  public componentsRequired = new Set([
    RelationshipsComponent,
    PositionComponent,
  ]);

  public update(entities: Set<Entity>): void {
    const entityArray = Array.from(entities);

    // Check potential interactions between nearby entities
    for (let i = 0; i < entityArray.length; i++) {
      const entityA = entityArray[i];
      const componentsA = this.ecs.getComponents(entityA);
      const posA = componentsA.get(PositionComponent);
      const relationsA = componentsA.get(RelationshipsComponent);

      for (let j = i + 1; j < entityArray.length; j++) {
        const entityB = entityArray[j];
        const componentsB = this.ecs.getComponents(entityB);
        const posB = componentsB.get(PositionComponent);

        // Calculate distance
        const distance = Math.sqrt(
          Math.pow(posA.x - posB.x, 2) + Math.pow(posA.y - posB.y, 2)
        );

        // If entities are close enough, they may interact
        if (distance < 10) {
          this.potentialInteraction(entityA, entityB, relationsA);
        }
      }
    }
  }

  private potentialInteraction(
    entityA: Entity,
    entityB: Entity,
    relationsA: RelationshipsComponent
  ): void {
    // Get current relationship or initialize it
    let relation = relationsA.getRelationship(entityB);
    if (!relation) {
      // Initialize with neutral relationship
      relationsA.addRelationship(entityB, "neutral", 0);
    } else if (Math.random() < 0.05) {
      // 5% chance of interaction per tick when nearby
      // Trigger a social interaction
      const interactionValue = this.calculateInteractionValue(entityA, entityB);
      relationsA.modifyRelationship(entityB, interactionValue);
    }
  }

  private calculateInteractionValue(entityA: Entity, entityB: Entity): number {
    // Complex calculation based on traits, history, context, etc.
    // For now, a simple random value
    return (Math.random() * 2 - 1) * 2; // -2 to +2 relationship change
  }
}
