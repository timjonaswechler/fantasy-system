import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Entity } from "@/engine/ecs";
import { AttributesComponent } from "@/engine/components/attributes-component";
import { NeedsComponent } from "@/engine/components/needs-component";
import { PositionComponent } from "@/engine/components/position-component";
import { GoalsComponent } from "@/engine/components/goals-component";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemoryComponent } from "@/engine/components/memory-component";
import { RelationshipsComponent } from "@/engine/components/relationships-component";

interface EntityDetailsProps {
  entityId: Entity | null;
  ecs: any; // The ECS instance
}

export function EntityDetails({ entityId, ecs }: EntityDetailsProps) {
  if (entityId === null || !ecs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entity Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No entity selected</p>
        </CardContent>
      </Card>
    );
  }

  try {
    // Get all components for this entity
    const components = ecs.getComponents(entityId);

    const hasAttributes = components.has(AttributesComponent);
    const hasNeeds = components.has(NeedsComponent);
    const hasPosition = components.has(PositionComponent);
    const hasGoals = components.has(GoalsComponent);
    const hasMemory = components.has(MemoryComponent);
    const hasRelationships = components.has(RelationshipsComponent);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Entity #{entityId}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Position */}
          {hasPosition && (
            <div className="space-y-2">
              <h3 className="font-medium">Position</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">X:</span>{" "}
                  {components.get(PositionComponent).x.toFixed(2)}
                </div>
                <div>
                  <span className="text-muted-foreground">Y:</span>{" "}
                  {components.get(PositionComponent).y.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Attributes */}
          {hasAttributes && (
            <div className="space-y-2">
              <h3 className="font-medium">Attributes</h3>
              <div className="space-y-2">
                {Array.from<[string, number]>(
                  components.get(AttributesComponent).attributes.entries()
                ).map(([name, value]) => (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="capitalize">{name}</span>
                      <span>{value.toFixed(1)}</span>
                    </div>
                    <Progress value={value} max={100} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Needs */}
          {hasNeeds && (
            <div className="space-y-2">
              <h3 className="font-medium">Needs</h3>
              <div className="space-y-2">
                {Array.from<
                  [
                    string,
                    { value: number; maxValue: number; decayRate: number }
                  ]
                >(components.get(NeedsComponent).needs.entries()).map(
                  ([name, { value, maxValue, decayRate }]) => (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="capitalize">{name}</span>
                        <span>
                          {value.toFixed(1)}/{maxValue} (−{decayRate}/tick)
                        </span>
                      </div>
                      <Progress
                        value={value}
                        max={maxValue}
                        className={`h-2 ${
                          value < maxValue * 0.3
                            ? "bg-red-200"
                            : value < maxValue * 0.7
                            ? "bg-yellow-200"
                            : "bg-green-200"
                        }`}
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Goals */}
          {hasGoals && components.get(GoalsComponent).goals.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Goals</h3>
              <div className="space-y-2">
                {components
                  .get(GoalsComponent)
                  .goals.map((goal: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="capitalize">{goal.id}</span>
                        <span>Priority: {goal.priority}</span>
                      </div>
                      <Progress
                        value={goal.progress}
                        max={100}
                        className="h-2"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Memories */}
          {hasMemory && (
            <div className="space-y-2">
              <h3 className="font-medium">Recent Memories</h3>
              {components.get(MemoryComponent).shortTermMemory.length > 0 ? (
                <div className="space-y-1 text-sm">
                  {components
                    .get(MemoryComponent)
                    .shortTermMemory.slice(-5)
                    .reverse()
                    .map((memory: any, index: number) => (
                      <div key={index} className="p-2 border rounded-md">
                        <div>{memory.event}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(memory.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No memories recorded
                </p>
              )}
            </div>
          )}

          {/* Relationships */}
          {hasRelationships && (
            <div className="space-y-2">
              <h3 className="font-medium">Relationships</h3>
              {Array.from(
                components.get(RelationshipsComponent).relationships.entries()
              ).length > 0 ? (
                <div className="space-y-1">
                  {Array.from<[number, { type: string; value: number }]>(
                    components
                      .get(RelationshipsComponent)
                      .relationships.entries()
                  ).map(([targetId, relation]) => {
                    return (
                      <div key={targetId} className="p-2 border rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                relation.type === "friend" ||
                                relation.type === "friendly"
                                  ? "bg-green-500"
                                  : relation.type === "enemy" ||
                                    relation.type === "hostile"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                              }`}
                            ></div>
                            <span>Entity #{targetId}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`capitalize font-medium px-1.5 py-0.5 rounded text-xs ${
                                relation.type === "friend"
                                  ? "bg-green-100 text-green-800"
                                  : relation.type === "friendly"
                                  ? "bg-green-50 text-green-700"
                                  : relation.type === "enemy"
                                  ? "bg-red-100 text-red-800"
                                  : relation.type === "hostile"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {relation.type}
                            </span>
                          </div>
                        </div>

                        <div className="mt-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">
                              Relationship value:
                            </span>
                            <span
                              className={
                                relation.value > 0
                                  ? "text-green-500"
                                  : relation.value < 0
                                  ? "text-red-500"
                                  : "text-gray-500"
                              }
                            >
                              {relation.value > 0 ? "+" : ""}
                              {relation.value}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                            {relation.value >= 0 ? (
                              <div
                                className="h-full bg-green-400 rounded-full"
                                style={{
                                  width: `${Math.min(relation.value, 100)}%`,
                                }}
                              ></div>
                            ) : (
                              <div
                                className="h-full bg-red-400 rounded-full ml-auto"
                                style={{
                                  width: `${Math.min(
                                    Math.abs(relation.value),
                                    100
                                  )}%`,
                                }}
                              ></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No relationships formed
                </p>
              )}
            </div>
          )}
        </CardContent>
        {/* </ScrollArea> */}
      </Card>
    );
  } catch (error) {
    // Entity might not exist anymore
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entity Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading entity #{entityId}</p>
        </CardContent>
      </Card>
    );
  }
}
