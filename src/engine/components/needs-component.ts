import { Component } from "@/engine/ecs";

// Need system (hunger, energy, etc)
export class NeedsComponent extends Component {
  public needs: Map<
    string,
    { value: number; maxValue: number; decayRate: number }
  > = new Map();

  constructor(
    needs: Record<
      string,
      { value: number; maxValue: number; decayRate: number }
    > = {}
  ) {
    super();
    Object.entries(needs).forEach(([key, value]) => {
      this.needs.set(key, value);
    });
  }

  public getNeed(
    name: string
  ): { value: number; maxValue: number; decayRate: number } | undefined {
    return this.needs.get(name);
  }

  public modifyNeed(name: string, amount: number): void {
    const need = this.needs.get(name);
    if (need) {
      need.value = Math.max(0, Math.min(need.maxValue, need.value + amount));
    }
  }
}
