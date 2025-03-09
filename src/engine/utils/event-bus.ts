import { Component } from "@/engine/ecs";

export type EventCallback = (data: any) => void;

export class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  public subscribe(eventType: string, callback: EventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  public publish(eventType: string, data: any): void {
    const callbacks = this.listeners.get(eventType) || [];
    for (const callback of callbacks) {
      callback(data);
    }
  }

  public unsubscribe(eventType: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}

// Add EventBus to the ECS class
export class WorldEventComponent extends Component {
  constructor(public eventBus: EventBus) {
    super();
  }
}
