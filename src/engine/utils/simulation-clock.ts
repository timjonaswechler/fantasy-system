import { ECS } from "@/engine/ecs";

export class SimulationClock {
  private tickRate: number = 20; // milliseconds per tick
  private accumulator: number = 0;
  private lastTime: number = 0;
  private isPaused: boolean = false;
  private timeScale: number = 1.0;
  private tickCount: number = 0;
  private ecs: ECS;

  constructor(ecs: ECS, tickRate: number = 20) {
    this.ecs = ecs;
    this.tickRate = tickRate;
    this.lastTime = performance.now();
  }

  public start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame(() => this.tick());
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    if (this.isPaused) {
      this.lastTime = performance.now();
      this.isPaused = false;
    }
  }

  public setTimeScale(scale: number): void {
    this.timeScale = Math.max(0.1, Math.min(10, scale)); // Limit scale between 0.1x and 10x
  }

  public getTickCount(): number {
    return this.tickCount;
  }

  private tick(): void {
    if (this.isPaused) {
      requestAnimationFrame(() => this.tick());
      return;
    }

    const currentTime = performance.now();
    let deltaTime = (currentTime - this.lastTime) * this.timeScale;
    this.lastTime = currentTime;

    // Add to accumulator
    this.accumulator += deltaTime;

    // Fixed time step updates
    while (this.accumulator >= this.tickRate) {
      this.ecs.update();
      this.accumulator -= this.tickRate;
      this.tickCount++;

      // Emit tick event if you add an event system
      // this.eventBus.emit('tick', { tickCount: this.tickCount });
    }

    requestAnimationFrame(() => this.tick());
  }
}
