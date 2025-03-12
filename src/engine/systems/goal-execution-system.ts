import { System } from "@/engine/ecs";
import { Entity } from "@/engine/ecs";
import { GoalsComponent } from "@/engine/components/goals-component";
import { PositionComponent } from "@/engine/components/position-component";
import { NeedsComponent } from "@/engine/components/needs-component";
import { MemoryComponent } from "@/engine/components/memory-component";
import { EventBus } from "@/engine/utils/event-bus";

// src/engine/systems/goal-execution-system.ts
export class GoalExecutionSystem extends System {
  public componentsRequired = new Set([GoalsComponent, PositionComponent]);
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    super();
    this.eventBus = eventBus;
  }

  public update(entities: Set<Entity>): void {
    for (const entity of entities) {
      const components = this.ecs.getComponents(entity);
      const goalsComponent = components.get(GoalsComponent);

      if (goalsComponent.goals.length === 0) continue;

      // Prioritätssortierung
      const sortedGoals = [...goalsComponent.goals].sort(
        (a, b) => b.priority - a.priority
      );
      const activeGoal = sortedGoals[0]; // Höchste Priorität

      // Ziel ausführen basierend auf Typ
      if (activeGoal.id.startsWith("survive_")) {
        this.executeSurvivalGoal(entity, activeGoal, components);
      } else if (activeGoal.id.startsWith("satisfy_")) {
        this.executeSatisfactionGoal(entity, activeGoal, components);
      } else {
        this.executeStandardGoal(entity, activeGoal, components);
      }

      // Wenn Ziel abgeschlossen
      if (activeGoal.progress >= 100) {
        this.completeGoal(entity, activeGoal, components);
      }
    }
  }

  private executeSurvivalGoal(
    entity: Entity,
    goal: any,
    components: any
  ): void {
    // Notfallaktionen für kritische Bedürfnisse implementieren
    const needName = goal.id.substring("survive_".length).toUpperCase();

    if (needName === "FOOD") {
      this.findAndMoveToFood(entity, components);
    } else if (needName === "WATER") {
      this.findAndMoveToWater(entity, components);
    } else if (needName === "REST") {
      this.findSafeRestLocation(entity, components);
    }

    // Fortschritt langsamer bei Überlebenszielen
    goal.progress += 3;
  }

  private executeSatisfactionGoal(
    entity: Entity,
    goal: any,
    components: any
  ): void {
    // Ähnlich wie Überleben, aber weniger dringend
    const needName = goal.id.substring("satisfy_".length).toUpperCase();

    // Bedürfnisbefriedigung implementieren
    if (needName === "FOOD") {
      this.moveTowardFood(entity, components);
    } else if (needName === "SOCIALIZE") {
      this.seekSocialInteraction(entity, components);
    }

    // Mittlerer Fortschritt
    goal.progress += 5;
  }

  private executeStandardGoal(
    entity: Entity,
    goal: any,
    components: any
  ): void {
    // Normale Ziele implementieren
    switch (goal.id) {
      case "explore":
        this.performExploration(entity, components);
        break;
      case "socialize":
        this.performSocialization(entity, components);
        break;
      case "craft":
        this.performCrafting(entity, components);
        break;
      case "idle":
        this.performIdle(entity, components);
        break;
    }

    // Schnellerer Fortschritt bei normalen Zielen
    goal.progress += 10;
  }

  private completeGoal(entity: Entity, goal: any, components: any): void {
    // Ziel entfernen
    const goalsComponent = components.get(GoalsComponent);
    goalsComponent.removeGoal(goal.id);

    // Wenn es ein Bedürfnisziel war, Bedürfnis befriedigen
    if (goal.id.startsWith("satisfy_") && components.has(NeedsComponent)) {
      const needsComponent = components.get(NeedsComponent);
      const needName = goal.id.substring("satisfy_".length).toUpperCase();
      needsComponent.satisfyNeed(needName, 0);
    }

    // Erinnerung speichern
    if (components.has(MemoryComponent)) {
      const memory = components.get(MemoryComponent);
      memory.remember(`Ziel abgeschlossen: ${goal.id}`, 2);
    }

    // Event emittieren
    if (this.eventBus) {
      this.eventBus.publish("goal:completed", {
        entity,
        goalId: goal.id,
      });
    }
  }

  // Implementierungsmethoden für konkrete Aktionen
  private findAndMoveToFood(entity: Entity, components: any): void {
    // Implementierung von Nahrungssuche bei kritischem Hunger
  }

  private moveTowardFood(entity: Entity, components: any): void {
    // Implementierung von Nahrungssuche bei normalem Hunger
  }

  private performExploration(entity: Entity, components: any): void {
    // Implementierung von Erkundungsverhalten
  }

  private performSocialization(entity: Entity, components: any): void {
    // Implementierung von Sozialverhalten
  }

  private performCrafting(entity: Entity, components: any): void {
    // Implementierung des Herstellungsverhaltens
  }

  private performIdle(entity: Entity, components: any): void {
    // Implementierung von Leerlaufverhalten
  }

  private findAndMoveToWater(entity: Entity, components: any): void {
    // Implementierung von Wassersuche bei kritischem Durst
  }

  private findSafeRestLocation(entity: Entity, components: any): void {
    // Implementierung der Suche nach sicherem Ruheplatz
  }

  private seekSocialInteraction(entity: Entity, components: any): void {
    // Implementierung der Suche nach sozialen Kontakten
  }

  // Weitere Aktionsmethoden...
}
