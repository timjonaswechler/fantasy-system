import { Component } from "@/engine/ecs";
import { Entity } from "@/engine/ecs";

// Relationships
export class RelationshipsComponent extends Component {
  public relationships: Map<Entity, { type: string; value: number }> =
    new Map();

  public addRelationship(target: Entity, type: string, value: number): void {
    this.relationships.set(target, { type, value });
  }

  public getRelationship(
    target: Entity
  ): { type: string; value: number } | undefined {
    return this.relationships.get(target);
  }

  public modifyRelationship(target: Entity, valueDelta: number): void {
    const rel = this.relationships.get(target);
    if (rel) {
      rel.value = Math.max(-100, Math.min(100, rel.value + valueDelta));
    }
  }
}
