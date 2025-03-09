import { Component } from "@/engine/ecs";

// Memory/state history
export class MemoryComponent extends Component {
  public shortTermMemory: { event: string; timestamp: number }[] = [];
  public longTermMemory: {
    event: string;
    timestamp: number;
    importance: number;
  }[] = [];

  public remember(event: string, importance: number = 1): void {
    const timestamp = Date.now();
    this.shortTermMemory.push({ event, timestamp });

    // Only important events go to long-term memory
    if (importance >= 3) {
      this.longTermMemory.push({ event, timestamp, importance });
    }

    // Limit short-term memory size
    if (this.shortTermMemory.length > 20) {
      this.shortTermMemory.shift();
    }
  }
}
