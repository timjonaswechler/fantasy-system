import { Component } from "@/engine/ecs";

// Goals and motivations
export class GoalsComponent extends Component {
  public goals: { id: string; priority: number; progress: number }[] = [];

  public addGoal(id: string, priority: number): void {
    this.goals.push({ id, priority, progress: 0 });
    this.goals.sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)
  }

  public removeGoal(id: string): void {
    const index = this.goals.findIndex((g) => g.id === id);
    if (index >= 0) {
      this.goals.splice(index, 1);
    }
  }

  public updateGoalProgress(id: string, progress: number): void {
    const goal = this.goals.find((g) => g.id === id);
    if (goal) {
      goal.progress = progress;
    }
  }
}
