import { System } from "@/engine/ecs";
import { Entity } from "@/engine/ecs";
import { PositionComponent } from "@/engine/components/position-component";
import { SpatialGrid } from "@/engine/utils/spatial-grid";

// System to maintain the spatial grid
export class SpatialSystem extends System {
  public componentsRequired = new Set([PositionComponent]);
  private grid: SpatialGrid;

  constructor(grid: SpatialGrid) {
    super();
    this.grid = grid;
  }

  public update(entities: Set<Entity>): void {
    for (const entity of entities) {
      const components = this.ecs.getComponents(entity);
      const position = components.get(PositionComponent);

      // Update entity position in the grid
      this.grid.updateEntityPosition(entity, position.x, position.y);
    }
  }
}
