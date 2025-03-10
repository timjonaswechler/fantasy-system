import { Component } from "@/engine/ecs";
import { Entity } from "@/engine/ecs";

// Enhanced Relationships Component
export class RelationshipsComponent extends Component {
  public relationships: Map<Entity, { type: string; value: number }> =
    new Map();

  /**
   * Add a new relationship with another entity
   * @param target The target entity ID
   * @param type Relationship type (friendly, neutral, hostile, etc.)
   * @param value Relationship value (-100 to 100)
   */
  public addRelationship(target: Entity, type: string, value: number): void {
    this.relationships.set(target, { type, value });
  }

  /**
   * Get existing relationship with an entity
   * @param target The target entity ID
   * @returns The relationship object or undefined if none exists
   */
  public getRelationship(
    target: Entity
  ): { type: string; value: number } | undefined {
    return this.relationships.get(target);
  }

  /**
   * Update relationship value with an entity
   * @param target The target entity ID
   * @param valueDelta The change in relationship value
   */
  public modifyRelationship(target: Entity, valueDelta: number): void {
    const rel = this.relationships.get(target);
    if (rel) {
      rel.value = Math.max(-100, Math.min(100, rel.value + valueDelta));
    }
  }

  /**
   * Update relationship type with an entity
   * @param target The target entity ID
   * @param newType The new relationship type
   */
  public updateRelationshipType(target: Entity, newType: string): void {
    const rel = this.relationships.get(target);
    if (rel) {
      rel.type = newType;
    }
  }

  /**
   * Get all entities with a specific relationship type
   * @param type The relationship type to filter by
   * @returns Array of entity IDs with that relationship type
   */
  public getEntitiesByType(type: string): Entity[] {
    const result: Entity[] = [];
    for (const [entityId, relationship] of this.relationships.entries()) {
      if (relationship.type === type) {
        result.push(entityId);
      }
    }
    return result;
  }

  /**
   * Get entities with a relationship value above a threshold
   * @param minValue The minimum relationship value
   * @returns Array of entity IDs with relationship values >= minValue
   */
  public getEntitiesByValueThreshold(minValue: number): Entity[] {
    const result: Entity[] = [];
    for (const [entityId, relationship] of this.relationships.entries()) {
      if (relationship.value >= minValue) {
        result.push(entityId);
      }
    }
    return result;
  }

  /**
   * Find the entity with the highest relationship value
   * @returns The entity ID with highest relationship value, or null if none
   */
  public getClosestRelationship(): Entity | null {
    let highestValue = -Infinity;
    let closestEntity: Entity | null = null;

    for (const [entityId, relationship] of this.relationships.entries()) {
      if (relationship.value > highestValue) {
        highestValue = relationship.value;
        closestEntity = entityId;
      }
    }

    return closestEntity;
  }
}
