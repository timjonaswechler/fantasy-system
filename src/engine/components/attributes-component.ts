import { Component } from "@/engine/ecs";

// Basic attributes
export class AttributesComponent extends Component {
  public attributes: Map<string, number> = new Map();

  constructor(attributes: Record<string, number> = {}) {
    super();
    Object.entries(attributes).forEach(([key, value]) => {
      this.attributes.set(key, value);
    });
  }

  public getAttribute(name: string): number {
    return this.attributes.get(name) || 0;
  }

  public setAttribute(name: string, value: number): void {
    this.attributes.set(name, value);
  }

  public modifyAttribute(name: string, delta: number): void {
    const current = this.getAttribute(name);
    this.setAttribute(name, current + delta);
  }
}
