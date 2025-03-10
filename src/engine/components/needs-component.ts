import { Component } from "@/engine/ecs";

export type NeedState =
  | "Unfettered" // 400 to 300
  | "Level-headed" // 299 to 200
  | "Untroubled" // 199 to 100
  | "Not distracted" // 99 to -999
  | "Unfocused" // -1,000 to -9,999
  | "Distracted" // -10,000 to -99,999
  | "Badly distracted"; // -100,000 and below

export type NeedCategory =
  | "Physical" // Hunger, thirst, rest
  | "Social" // Friendship, family, romance
  | "Mental" // Learning, creating, thinking
  | "Spiritual" // Praying, meditating
  | "Recreational" // Fun, excitement, leisure
  | "Emotional" // Expression, art
  | "Professional"; // Craft, skill, martial prowess

export interface Need {
  value: number; // Current fulfillment level (-100,000 to 400)
  maxValue: number; // Maximum fulfillment (typically 400)
  decayRate: number; // How quickly the need decays per tick
  priority: number; // Importance (1-10)
  category: NeedCategory; // Type of need
  lastFulfilled?: number; // Tick when last fulfilled
}

// Enhanced needs component that tracks entity's needs and calculates focus
export class NeedsComponent extends Component {
  public needs: Map<string, Need> = new Map();

  constructor(needs: Record<string, Need> = {}) {
    super();
    Object.entries(needs).forEach(([key, value]) => {
      this.needs.set(key, value);
    });
  }

  /**
   * Calculate overall focus level (ratio of met vs unmet needs)
   * Focus affects an entity's performance in all tasks
   * @returns Focus percentage (higher is better)
   */
  public calculateFocus(): number {
    if (this.needs.size === 0) return 100;

    let focusPoints = 0;
    let totalPossible = 0;

    // Calculate points from each need based on DF algorithm
    for (const [_, need] of this.needs.entries()) {
      // Weight by priority
      const weight = need.priority;
      totalPossible += 4 * weight; // Max contribution per need

      // Calculate points for this need based on its state
      let needPoints = 0;
      if (need.value >= 300) {
        needPoints = 6; // Unfettered
      } else if (need.value >= 200) {
        needPoints = 5.33; // Level-headed
      } else if (need.value >= 100) {
        needPoints = 4.67; // Untroubled
      } else if (need.value >= -999) {
        needPoints = 4; // Not distracted
      } else if (need.value >= -9999) {
        needPoints = 3.33; // Unfocused
      } else if (need.value >= -99999) {
        needPoints = 2.67; // Distracted
      } else {
        needPoints = 2; // Badly distracted
      }

      focusPoints += needPoints * weight;
    }

    // Calculate focus percentage
    return Math.floor((focusPoints / totalPossible) * 100);
  }

  /**
   * Get the state description for a need value
   */
  public getNeedState(value: number): NeedState {
    if (value >= 300) return "Unfettered";
    if (value >= 200) return "Level-headed";
    if (value >= 100) return "Untroubled";
    if (value >= -999) return "Not distracted";
    if (value >= -9999) return "Unfocused";
    if (value >= -99999) return "Distracted";
    return "Badly distracted";
  }

  /**
   * Get all needs of a specific category
   */
  public getNeedsByCategory(category: NeedCategory): Map<string, Need> {
    const result = new Map<string, Need>();

    for (const [name, need] of this.needs.entries()) {
      if (need.category === category) {
        result.set(name, need);
      }
    }

    return result;
  }

  /**
   * Get the most critical needs (lowest values)
   */
  public getCriticalNeeds(count: number = 3): [string, Need][] {
    return Array.from(this.needs.entries())
      .sort(([_, a], [__, b]) => a.value - b.value)
      .slice(0, count);
  }

  /**
   * Satisfy a need (set to maximum value)
   */
  public satisfyNeed(name: string, tickCount: number): boolean {
    const need = this.needs.get(name);
    if (need) {
      need.value = need.maxValue;
      need.lastFulfilled = tickCount;
      return true;
    }
    return false;
  }

  /**
   * Get focus level description
   */
  public getFocusDescription(focus: number): string {
    if (focus >= 140) return "Very focused";
    if (focus >= 120) return "Quite focused";
    if (focus >= 101) return "Focused";
    if (focus === 100) return "Untroubled";
    if (focus >= 80) return "Unfocused";
    if (focus >= 50) return "Distracted";
    return "Badly distracted";
  }

  /**
   * Calculate the skill modifier based on focus
   * Between +50% (very focused) and -50% (badly distracted)
   */
  public getSkillModifier(focus: number): number {
    if (focus >= 140) return 0.5; // +50% skill boost
    if (focus >= 120) return 0.3; // +30% skill boost
    if (focus >= 101) return 0.1; // +10% skill boost
    if (focus === 100) return 0; // No modifier
    if (focus >= 80) return -0.1; // -10% skill penalty
    if (focus >= 50) return -0.3; // -30% skill penalty
    return -0.5; // -50% skill penalty
  }
}
