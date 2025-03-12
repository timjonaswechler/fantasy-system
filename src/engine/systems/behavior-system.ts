import { System } from "@/engine/ecs";
import { Entity } from "@/engine/ecs";
import { GoalsComponent } from "../components/goals-component";
import { NeedsComponent } from "../components/needs-component";
import { PositionComponent } from "../components/position-component";
import { MemoryComponent } from "../components/memory-component";
import { AttributesComponent } from "../components/attributes-component";
import { EventBus } from "../utils/event-bus";

// src/engine/systems/behavior-system.ts
export class BehaviorSystem extends System {
  public componentsRequired = new Set([
    GoalsComponent,
    NeedsComponent,
    PositionComponent,
  ]);
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    super();
    this.eventBus = eventBus;
  }

  public update(entities: Set<Entity>): void {
    for (const entity of entities) {
      // Entscheiden, was die Entität als nächstes tun soll
      this.decideAndExecuteActivity(entity);
    }
  }

  private decideAndExecuteActivity(entity: Entity): void {
    const components = this.ecs.getComponents(entity);
    const needsComponent = components.get(NeedsComponent);
    const goalsComponent = components.get(GoalsComponent);

    // SCHRITT 1: Prüfen auf lebensbedrohliche Bedürfnisse
    const criticalNeeds = this.getLifeThreateningNeeds(needsComponent);
    if (criticalNeeds.length > 0) {
      // Überlebenskampf - höchste Priorität
      this.handleSurvival(entity, criticalNeeds[0], components);
      return; // Sofort beenden, alles andere ist unwichtig
    }

    // SCHRITT 2: Prüfen auf stark kritische Bedürfnisse
    const urgentNeeds = this.getUrgentNeeds(needsComponent);
    if (urgentNeeds.length > 0) {
      // Kritisches Bedürfnis - hohe Priorität
      this.handleUrgentNeed(entity, urgentNeeds[0], components);
      return;
    }

    // SCHRITT 3: Wenn keine kritischen Bedürfnisse, Ziele verfolgen
    if (goalsComponent.goals.length > 0) {
      // Sortieren nach Priorität
      const sortedGoals = [...goalsComponent.goals].sort(
        (a, b) => b.priority - a.priority
      );
      this.pursueGoal(entity, sortedGoals[0], components);
    } else {
      // SCHRITT 4: Keine Ziele - neues Ziel basierend auf Persönlichkeit wählen
      this.chooseNewGoal(entity, components);
    }
  }

  // HILFSMETHODEN

  private getLifeThreateningNeeds(needsComponent: NeedsComponent): string[] {
    const result: string[] = [];
    for (const [name, need] of needsComponent.needs.entries()) {
      // Wert < -50000 gilt als lebensbedrohlich
      if (need.value < -50000) {
        result.push(name);
      }
    }
    return result;
  }

  private getUrgentNeeds(needsComponent: NeedsComponent): string[] {
    const result: string[] = [];
    for (const [name, need] of needsComponent.needs.entries()) {
      // Wert < -10000 gilt als kritisch/dringend
      if (need.value < -10000 && need.value >= -50000) {
        result.push(name);
      }
    }
    return result;
  }

  // AKTIONSIMPLEMENTIERUNGEN

  private handleSurvival(
    entity: Entity,
    needName: string,
    components: any
  ): void {
    // Überlebenskampf-Logik
    const memoryComponent = components.get(MemoryComponent);
    const positionComponent = components.get(PositionComponent);

    // Konkrete Überlebensaktionen je nach Bedürfnis
    switch (needName) {
      case "FOOD":
        // Alle verfügbare Nahrung suchen, auch riskante
        this.moveToNearestFood(entity, positionComponent);
        memoryComponent?.remember(
          "Verzweifelter Hunger! Muss sofort Nahrung finden oder ich sterbe!",
          5
        );
        break;
      case "WATER":
        this.moveToNearestWater(entity, positionComponent);
        memoryComponent?.remember("Verdurste! Brauche sofort Wasser!", 5);
        break;
      case "REST":
        this.findEmergencyShelter(entity, positionComponent);
        memoryComponent?.remember(
          "Totale Erschöpfung! Muss sofort Schutz finden!",
          5
        );
        break;
      // weitere kritische Bedürfnisse...
    }

    // Überleben-Event auslösen
    this.eventBus?.publish("behavior:survival_mode", {
      entity,
      needName,
    });
  }

  private handleUrgentNeed(
    entity: Entity,
    needName: string,
    components: any
  ): void {
    // Dringende Bedürfnisbefriedigung
    const positionComponent = components.get(PositionComponent);
    const memoryComponent = components.get(MemoryComponent);

    switch (needName) {
      case "FOOD":
        this.seekFood(entity, positionComponent);
        memoryComponent?.remember(
          "Ich bin sehr hungrig, muss bald etwas essen",
          3
        );
        break;
      case "WATER":
        this.seekWater(entity, positionComponent);
        memoryComponent?.remember("Ich habe starken Durst", 3);
        break;
      case "SOCIALIZE":
        this.seekSocialContact(entity, positionComponent);
        memoryComponent?.remember(
          "Ich fühle mich einsam, brauche Gesellschaft",
          2
        );
        break;
      // weitere Bedürfnisse...
    }

    this.eventBus?.publish("behavior:addressing_urgent_need", {
      entity,
      needName,
    });
  }

  private pursueGoal(entity: Entity, goal: any, components: any): void {
    // Ziel verfolgen
    const positionComponent = components.get(PositionComponent);

    switch (goal.id) {
      case "explore":
        this.exploreArea(entity, positionComponent);
        goal.progress += 5;
        break;
      case "craft":
        this.performCrafting(entity, components);
        goal.progress += 3;
        break;
      case "socialize":
        this.socializeWithOthers(entity, positionComponent);
        goal.progress += 4;
        break;
      // weitere Ziele...
    }

    // Prüfen, ob Ziel abgeschlossen
    if (goal.progress >= 100) {
      this.completeGoal(entity, goal, components);
    }

    this.eventBus?.publish("behavior:pursuing_goal", {
      entity,
      goalId: goal.id,
      progress: goal.progress,
    });
  }

  private chooseNewGoal(entity: Entity, components: any): void {
    // Persönlichkeitsbasiertes Ziel wählen
    const goalsComponent = components.get(GoalsComponent);
    const attributesComponent = components.get(AttributesComponent);

    // Persönlichkeitseinfluss auf Zielwahl
    if (attributesComponent) {
      const curiosity =
        attributesComponent.getAttribute("ANALYTICAL_ABILITY") || 1000;
      const social =
        attributesComponent.getAttribute("SOCIAL_AWARENESS") || 1000;
      const creativity = attributesComponent.getAttribute("CREATIVITY") || 1000;

      const randomValue = Math.random() * 100;

      // Ziele basierend auf Attributen und Zufallsfaktor wählen
      if (curiosity > 1300 && randomValue < 40) {
        goalsComponent.addGoal("explore", 4);
      } else if (social > 1300 && randomValue < 70) {
        goalsComponent.addGoal("socialize", 3);
      } else if (creativity > 1300 && randomValue < 90) {
        goalsComponent.addGoal("craft", 3);
      } else {
        // Standardziel, wenn nichts anderes passt
        goalsComponent.addGoal("idle", 1);
      }
    } else {
      // Standardziel ohne Attribute
      goalsComponent.addGoal("idle", 1);
    }

    this.eventBus?.publish("behavior:new_goal_chosen", {
      entity,
      goalId: goalsComponent.goals[goalsComponent.goals.length - 1].id,
    });
  }

  private completeGoal(entity: Entity, goal: any, components: any): void {
    // Ziel abschließen und löschen
    const goalsComponent = components.get(GoalsComponent);
    const needsComponent = components.get(NeedsComponent);
    const memoryComponent = components.get(MemoryComponent);

    // Ziel aus Liste entfernen
    goalsComponent.removeGoal(goal.id);

    // Wenn Ziel ein Bedürfnisziel war, Bedürfnis befriedigen
    if (goal.id.startsWith("satisfy_")) {
      const needName = goal.id.substring(8).toUpperCase();
      needsComponent.satisfyNeed(needName, 0);
      memoryComponent?.remember(
        `Ich habe mein Bedürfnis nach ${needName} befriedigt.`,
        2
      );
    } else {
      memoryComponent?.remember(`Ich habe mein Ziel "${goal.id}" erreicht.`, 2);
    }

    this.eventBus?.publish("behavior:goal_completed", {
      entity,
      goalId: goal.id,
    });
  }

  // Spezifische Verhaltensmethoden
  private moveToNearestFood(entity: Entity, positionComponent: any): void {
    // Implementierung der Bewegung zur nächsten Nahrung
  }

  private seekFood(entity: Entity, positionComponent: any): void {
    // Implementierung der Nahrungssuche
  }

  private exploreArea(entity: Entity, positionComponent: any): void {
    // Implementierung der Erkundung
  }

  private performCrafting(entity: Entity, components: any): void {
    // Implementierung des Herstellungsprozesses
  }

  private socializeWithOthers(entity: Entity, positionComponent: any): void {
    // Implementierung des Sozialisierens mit anderen
  }

  private seekSocialContact(entity: Entity, positionComponent: any): void {
    // Implementierung der Suche nach sozialen Kontakten
  }

  private moveToNearestWater(entity: Entity, positionComponent: any): void {
    // Implementierung der Bewegung zur nächsten Wasserquelle
  }

  private seekWater(entity: Entity, positionComponent: any): void {
    // Implementierung der Wassersuche
  }

  private findEmergencyShelter(entity: Entity, positionComponent: any): void {
    // Implementierung der Suche nach Notunterkunft
  }

  // weitere Verhaltensmethoden...
}
