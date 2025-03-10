import { System } from "@/engine/ecs";
import { Entity } from "@/engine/ecs";
import { PositionComponent } from "@/engine/components/position-component";
import { AttributesComponent } from "@/engine/components/attributes-component";
import { GoalsComponent } from "@/engine/components/goals-component";
import { RelationshipsComponent } from "@/engine/components/relationships-component";

// System to handle entity movement
export class MovementSystem extends System {
  public componentsRequired = new Set([PositionComponent, AttributesComponent]);
  private worldWidth: number;
  private worldHeight: number;

  constructor(worldWidth: number = 800, worldHeight: number = 600) {
    super();
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }

  public update(entities: Set<Entity>): void {
    const entityArray = Array.from(entities);
    const entityPositions = new Map<Entity, { x: number; y: number }>();

    // First collect all entity positions
    for (const entity of entityArray) {
      try {
        const components = this.ecs.getComponents(entity);
        if (components.has(PositionComponent)) {
          const position = components.get(PositionComponent);
          entityPositions.set(entity, { x: position.x, y: position.y });
        }
      } catch (error) {
        // Entity might not exist anymore
      }
    }

    // Now process movement for each entity
    for (const entity of entityArray) {
      try {
        const components = this.ecs.getComponents(entity);
        const position = components.get(PositionComponent);
        const attributes = components.get(AttributesComponent);

        // Get entity's speed from attributes (or default to a small value)
        const speed = attributes.getAttribute("speed") / 20 || 0.5;

        // Check if entity has relationships and goals
        const hasRelationships = components.has(RelationshipsComponent);
        const hasGoals = components.has(GoalsComponent);

        // By default, entities do random wandering
        let shouldRandomWander = true;

        // Check if entity has goals that influence movement
        if (hasGoals) {
          const goals = components.get(GoalsComponent);

          // Check for socialize goal
          const socializeGoal = goals.goals.find((g) => g.id === "socialize");
          if (socializeGoal && hasRelationships) {
            shouldRandomWander = false;
            const relationships = components.get(RelationshipsComponent);

            // Try to find a friend to move towards
            const friends = relationships.getEntitiesByType("friend");
            const friendly = relationships.getEntitiesByType("friendly");
            const potentialTargets = [...friends, ...friendly];

            if (potentialTargets.length > 0) {
              // Pick a random friendly entity to socialize with
              const targetEntity =
                potentialTargets[
                  Math.floor(Math.random() * potentialTargets.length)
                ];
              const targetPos = entityPositions.get(targetEntity);

              if (targetPos) {
                // Move towards target entity
                this.moveTowards(position, targetPos, speed * 1.5);

                // Check if we're close enough to consider the interaction complete
                const distance = Math.sqrt(
                  Math.pow(position.x - targetPos.x, 2) +
                    Math.pow(position.y - targetPos.y, 2)
                );

                if (distance < 20) {
                  // If close enough, increase goal progress
                  socializeGoal.progress += 10;
                } else {
                  // Small progress just for trying
                  socializeGoal.progress += 0.5;
                }
              }
            } else {
              // If no friends yet, move towards random entity to make new friends
              const randomEntityIndex = Math.floor(
                Math.random() * entityArray.length
              );
              const randomEntity = entityArray[randomEntityIndex];

              if (randomEntity !== entity) {
                // Don't try to move to self
                const targetPos = entityPositions.get(randomEntity);
                if (targetPos) {
                  this.moveTowards(position, targetPos, speed);
                  socializeGoal.progress += 0.2; // Small progress
                }
              }
            }
          }

          // Check for explore goal
          const exploreGoal = goals.goals.find(
            (g) => g.id === "explore_surroundings"
          );
          if (exploreGoal) {
            shouldRandomWander = false;

            // Move in a more directed way
            const angle = Math.random() * Math.PI * 2;
            const dx = Math.cos(angle) * speed * 2; // Move faster when exploring
            const dy = Math.sin(angle) * speed * 2;

            // Update position with boundary checking
            position.x = Math.max(
              0,
              Math.min(this.worldWidth, position.x + dx)
            );
            position.y = Math.max(
              0,
              Math.min(this.worldHeight, position.y + dy)
            );

            // Update goal progress
            exploreGoal.progress += speed / 2;
          }

          // Check for avoid goal - move away from enemies
          if (hasRelationships) {
            const relationships = components.get(RelationshipsComponent);
            const enemies = relationships.getEntitiesByType("enemy");
            const hostile = relationships.getEntitiesByType("hostile");
            const threats = [...enemies, ...hostile];

            if (threats.length > 0) {
              shouldRandomWander = false;

              // Find the closest threat
              let closestThreat = null;
              let closestDistance = Infinity;

              for (const threatEntity of threats) {
                const threatPos = entityPositions.get(threatEntity);
                if (threatPos) {
                  const distance = Math.sqrt(
                    Math.pow(position.x - threatPos.x, 2) +
                      Math.pow(position.y - threatPos.y, 2)
                  );

                  if (distance < closestDistance && distance < 100) {
                    closestDistance = distance;
                    closestThreat = threatPos;
                  }
                }
              }

              // If a nearby threat was found, move away from it
              if (closestThreat) {
                // Calculate direction away from threat
                const dx = position.x - closestThreat.x;
                const dy = position.y - closestThreat.y;

                // Normalize and apply speed
                const length = Math.sqrt(dx * dx + dy * dy);
                if (length > 0) {
                  const normalizedDx = dx / length;
                  const normalizedDy = dy / length;

                  // Move away with increased speed (flight response)
                  position.x = Math.max(
                    0,
                    Math.min(
                      this.worldWidth,
                      position.x + normalizedDx * speed * 3
                    )
                  );
                  position.y = Math.max(
                    0,
                    Math.min(
                      this.worldHeight,
                      position.y + normalizedDy * speed * 3
                    )
                  );
                }
              }
            }
          }
        }

        // Do random wandering if no specific movement goal was processed
        if (shouldRandomWander && Math.random() < 0.05) {
          // 5% chance to change direction each tick
          const angle = Math.random() * Math.PI * 2; // Random direction
          const dx = Math.cos(angle) * speed;
          const dy = Math.sin(angle) * speed;

          // Update position with boundary checking
          position.x = Math.max(0, Math.min(this.worldWidth, position.x + dx));
          position.y = Math.max(0, Math.min(this.worldHeight, position.y + dy));
        }
      } catch (error) {
        // Entity might not exist anymore, skip
      }
    }
  }

  // Helper method to move a position towards a target
  private moveTowards(
    position: { x: number; y: number },
    target: { x: number; y: number },
    speed: number
  ): void {
    // Calculate direction to target
    const dx = target.x - position.x;
    const dy = target.y - position.y;

    // Normalize and apply speed
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
      const normalizedDx = dx / length;
      const normalizedDy = dy / length;

      // Move towards target
      position.x = Math.max(
        0,
        Math.min(this.worldWidth, position.x + normalizedDx * speed)
      );
      position.y = Math.max(
        0,
        Math.min(this.worldHeight, position.y + normalizedDy * speed)
      );
    }
  }
}
