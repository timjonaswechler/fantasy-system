import { Component } from "@/engine/ecs";

// Enhanced attributes component with DF-inspired ranges and descriptions
export class AttributesComponent extends Component {
  // Maps to store base and current values
  private baseAttributes: Map<string, number> = new Map();
  public attributes: Map<string, number> = new Map();
  // Track experience points toward attribute improvements
  private attributeExp: Map<string, number> = new Map();

  constructor(attributes: Record<string, number> = {}) {
    super();
    // Initialize with provided attributes or defaults
    Object.entries(attributes).forEach(([key, value]) => {
      this.baseAttributes.set(key, value);
      this.attributes.set(key, value);
      this.attributeExp.set(key, 0);
    });
  }

  // Get the current value of an attribute
  public getAttribute(name: string): number {
    return this.attributes.get(name) || 0;
  }

  // Get the base value (unmodified by effects)
  public getBaseAttribute(name: string): number {
    return this.baseAttributes.get(name) || 0;
  }

  // Set the base value of an attribute
  public setBaseAttribute(name: string, value: number): void {
    value = Math.max(0, Math.min(5000, value)); // Clamp to valid range
    this.baseAttributes.set(name, value);
    this.attributes.set(name, value); // Update current value as well
  }

  // Update current attribute value (temporary effects)
  public setAttribute(name: string, value: number): void {
    value = Math.max(0, Math.min(5000, value)); // Clamp to valid range
    this.attributes.set(name, value);
  }

  // Modify an attribute's current value
  public modifyAttribute(name: string, delta: number): void {
    const current = this.getAttribute(name);
    this.setAttribute(name, current + delta);
  }

  // Add experience points toward an attribute improvement
  public trainAttribute(name: string, expPoints: number): boolean {
    // Ensure attribute exists
    if (!this.baseAttributes.has(name)) {
      this.baseAttributes.set(name, 1000); // Default average value
      this.attributes.set(name, 1000);
      this.attributeExp.set(name, 0);
    }

    // Get current exp and base value
    const currentExp = this.attributeExp.get(name) || 0;
    const baseValue = this.baseAttributes.get(name) || 1000;

    // Cost to improve increases with attribute value
    const costToImprove = 500 + Math.floor(baseValue / 200) * 100;

    // Add experience points
    this.attributeExp.set(name, currentExp + expPoints);

    // Check if enough experience to improve
    if (this.attributeExp.get(name)! >= costToImprove) {
      // Improvement happens! Increment base value
      const newValue = baseValue + 1;
      this.baseAttributes.set(name, newValue);
      this.attributes.set(name, newValue);
      this.attributeExp.set(name, 0); // Reset experience
      return true; // Attribute improved
    }

    return false; // Not enough exp yet
  }

  // Get a text description for an attribute (DF style)
  public getAttributeDescription(
    name: string,
    speciesMedian: number = 1000
  ): string {
    const value = this.getAttribute(name);

    // Calculate difference from species median
    const diff = value - speciesMedian;

    // Return appropriate description based on category
    if (name === "strength") {
      if (diff >= 1250) return "unbelievably strong";
      if (diff >= 1000) return "mighty";
      if (diff >= 750) return "very strong";
      if (diff >= 500) return "strong";
      if (diff > 0) return ""; // No description for slightly above average
      if (diff > -250) return "weak";
      if (diff > -500) return "very weak";
      if (diff > -750) return "unquestionably weak";
      return "unfathomably weak";
    } else if (name === "agility") {
      if (diff >= 1000) return "amazingly agile";
      if (diff >= 750) return "extremely agile";
      if (diff >= 500) return "very agile";
      if (diff >= 250) return "agile";
      if (diff > -350) return ""; // No description for average
      if (diff > -600) return "clumsy";
      if (diff > -850) return "quite clumsy";
      return "totally clumsy";
    }
    // Add similar scales for other attributes
    // Default for other attributes
    if (diff >= 1000) return "extraordinary";
    if (diff >= 500) return "exceptional";
    if (diff >= 250) return "above average";
    if (diff > -250) return ""; // No description for average
    if (diff > -500) return "below average";
    if (diff > -750) return "poor";
    return "terrible";
  }

  // Reset temporary effects (restore current to base values)
  public resetTemporaryEffects(): void {
    for (const [key, value] of this.baseAttributes.entries()) {
      this.attributes.set(key, value);
    }
  }
}
