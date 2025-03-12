import { Component } from "@/engine/ecs";

export interface Goal {
  id: string;
  priority: number;
  progress: number;
}

export class GoalsComponent implements Component {
  public goals: Goal[] = [];

  constructor() {
    this.goals = [];
  }

  public addGoal(id: string, priority: number = 1): void {
    // Check if goal already exists
    if (this.hasGoal(id)) return;

    this.goals.push({
      id,
      priority,
      progress: 0,
    });
  }

  public removeGoal(id: string): void {
    this.goals = this.goals.filter((goal) => goal.id !== id);
  }

  public hasGoal(id: string): boolean {
    return this.goals.some((goal) => goal.id === id);
  }
}
