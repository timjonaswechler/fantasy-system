import { Entity } from "@/engine/ecs";

export class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, Set<Entity>> = new Map();

  constructor(cellSize: number = 50) {
    this.cellSize = cellSize;
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  public updateEntityPosition(
    entity: Entity,
    x: number,
    y: number,
    oldX?: number,
    oldY?: number
  ): void {
    // Remove from old cell if provided
    if (oldX !== undefined && oldY !== undefined) {
      const oldCellKey = this.getCellKey(oldX, oldY);
      const oldCell = this.grid.get(oldCellKey);
      if (oldCell) {
        oldCell.delete(entity);
        if (oldCell.size === 0) {
          this.grid.delete(oldCellKey);
        }
      }
    }

    // Add to new cell
    const newCellKey = this.getCellKey(x, y);
    if (!this.grid.has(newCellKey)) {
      this.grid.set(newCellKey, new Set());
    }
    this.grid.get(newCellKey)!.add(entity);
  }

  public getNearbyEntities(x: number, y: number, radius: number): Entity[] {
    const result: Entity[] = [];
    const centerCellX = Math.floor(x / this.cellSize);
    const centerCellY = Math.floor(y / this.cellSize);
    const cellRadius = Math.ceil(radius / this.cellSize);

    // Check all cells in a square around the center
    for (
      let cellX = centerCellX - cellRadius;
      cellX <= centerCellX + cellRadius;
      cellX++
    ) {
      for (
        let cellY = centerCellY - cellRadius;
        cellY <= centerCellY + cellRadius;
        cellY++
      ) {
        const cellKey = `${cellX},${cellY}`;
        const cell = this.grid.get(cellKey);
        if (cell) {
          result.push(...cell);
        }
      }
    }

    return result;
  }
}
