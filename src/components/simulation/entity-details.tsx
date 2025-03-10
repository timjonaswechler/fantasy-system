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
import { PersonalityComponent } from "@/engine/components/personality-component";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
    const hasPersonality = components.has(PersonalityComponent);

    // Calculate focus if entity has needs
    const focus = hasNeeds
      ? components.get(NeedsComponent).calculateFocus()
      : 100;
    const focusDescription = hasNeeds
      ? components.get(NeedsComponent).getFocusDescription(focus)
      : "Untroubled";
    const skillModifier = hasNeeds
      ? components.get(NeedsComponent).getSkillModifier(focus)
      : 0;

    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Entity #{entityId}</CardTitle>
            <Badge
              variant={
                focus >= 120
                  ? "default"
                  : focus >= 100
                  ? "outline"
                  : focus >= 80
                  ? "secondary"
                  : "destructive"
              }
            >
              {focusDescription}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="details">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="details" className="flex-1">
                Details
              </TabsTrigger>
              <TabsTrigger value="needs" className="flex-1">
                Needs
              </TabsTrigger>
              <TabsTrigger value="personality" className="flex-1">
                Personality
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-0 space-y-6">
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

              {/* Focus */}
              {hasNeeds && (
                <div className="space-y-2">
                  <h3 className="font-medium">Focus</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Level:</span>
                      <span
                        className={
                          focus >= 140
                            ? "text-green-600 font-medium"
                            : focus >= 120
                            ? "text-green-500"
                            : focus >= 100
                            ? "text-blue-500"
                            : focus >= 80
                            ? "text-yellow-500"
                            : "text-red-500"
                        }
                      >
                        {focus}% ({focusDescription})
                      </span>
                    </div>
                    <Progress
                      value={focus}
                      max={140}
                      className={`h-2 ${
                        focus >= 140
                          ? "bg-green-600"
                          : focus >= 120
                          ? "bg-green-500"
                          : focus >= 100
                          ? "bg-blue-500"
                          : focus >= 80
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Skill Modifier: {skillModifier >= 0 ? "+" : ""}
                      {Math.round(skillModifier * 100)}%
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
                    )
                      .filter(([name]) => !name.startsWith("base"))
                      .map(([name, value]) => (
                        <div key={name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{name}</span>
                            <span>{value.toFixed(1)}</span>
                          </div>
                          <Progress value={value} max={100} className="h-2" />
                        </div>
                      ))}
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
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">
                              {goal.id.replace(/_/g, " ")}
                            </span>
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
                <>
                  <div className="space-y-2">
                    <h3 className="font-medium">Short Term Memories</h3>
                    {components.get(MemoryComponent).shortTermMemory.length >
                    0 ? (
                      <div className="space-y-1 text-sm">
                        {components
                          .get(MemoryComponent)
                          .shortTermMemory.slice(-5)
                          .reverse()
                          .map((memory: any, index: number) => (
                            <div key={index} className="p-2 border rounded-md">
                              <div>{memory.event}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(
                                  memory.timestamp
                                ).toLocaleTimeString()}
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
                  <div className="space-y-2">
                    <h3 className="font-medium">Long Term Memories</h3>
                    {components.get(MemoryComponent).longTermMemory.length >
                    0 ? (
                      <div className="space-y-1 text-sm">
                        {components
                          .get(MemoryComponent)
                          .longTermMemory.slice()
                          .reverse()
                          .map((memory: any, index: number) => (
                            <div key={index} className="p-2 border rounded-md">
                              <div>{memory.event}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(
                                  memory.timestamp
                                ).toLocaleTimeString()}
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
                </>
              )}
            </TabsContent>

            <TabsContent value="needs" className="mt-0 space-y-6">
              {/* Needs by Category */}
              {hasNeeds && (
                <>
                  <div className="space-y-1">
                    <h3 className="font-medium">Critical Needs</h3>
                    {(
                      components.get(NeedsComponent).getCriticalNeeds(3) as [
                        string,
                        any
                      ][]
                    ).map(([name, need]) => (
                      <div
                        key={name}
                        className="p-2 border rounded-md space-y-1 mb-2"
                      >
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{name}</span>
                          <Badge
                            variant={
                              need.value >= 0
                                ? "outline"
                                : need.value >= -9999
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {components
                              .get(NeedsComponent)
                              .getNeedState(need.value)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-xs text-muted-foreground">
                            {need.category}
                          </span>
                          <div className="flex-1"></div>
                          <span className="text-xs font-medium">
                            Priority: {need.priority}
                          </span>
                        </div>
                        <Progress
                          value={Math.max(0, need.value)}
                          max={400}
                          className="h-2 bg-red-100"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Physical Needs */}
                  <div className="space-y-1">
                    <h3 className="font-medium">Physical Needs</h3>
                    {Array.from<[string, any]>(
                      components
                        .get(NeedsComponent)
                        .getNeedsByCategory("Physical")
                        .entries()
                    ).map(([name, need]: [string, any]) => (
                      <div
                        key={name}
                        className="p-2 border rounded-md space-y-1 mb-2"
                      >
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{name}</span>
                          <Badge
                            variant={
                              need.value >= 300
                                ? "default"
                                : need.value >= 100
                                ? "outline"
                                : need.value >= -999
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {components
                              .get(NeedsComponent)
                              .getNeedState(need.value)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-xs text-muted-foreground">
                            Physical
                          </span>
                          <div className="flex-1"></div>
                          <span className="text-xs font-medium">
                            Priority: {need.priority}
                          </span>
                        </div>
                        <Progress
                          value={Math.max(0, need.value)}
                          max={400}
                          className={`h-2 ${
                            need.value >= 300
                              ? "bg-green-500"
                              : need.value >= 100
                              ? "bg-blue-500"
                              : need.value >= -999
                              ? "bg-yellow-500"
                              : need.value >= -9999
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Social Needs */}
                  <div className="space-y-1">
                    <h3 className="font-medium">Social Needs</h3>
                    {Array.from<[string, any]>(
                      components
                        .get(NeedsComponent)
                        .getNeedsByCategory("Social")
                        .entries()
                    ).map(([name, need]: [string, any]) => (
                      <div
                        key={name}
                        className="p-2 border rounded-md space-y-1 mb-2"
                      >
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{name}</span>
                          <Badge
                            variant={
                              need.value >= 300
                                ? "default"
                                : need.value >= 100
                                ? "outline"
                                : need.value >= -999
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {components
                              .get(NeedsComponent)
                              .getNeedState(need.value)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs text-muted-foreground">
                            Social
                          </span>
                          <div className="flex-1"></div>
                          <span className="text-xs font-medium">
                            Priority: {need.priority}
                          </span>
                        </div>
                        <Progress
                          value={Math.max(0, need.value)}
                          max={400}
                          className={`h-2 ${
                            need.value >= 300
                              ? "bg-green-500"
                              : need.value >= 100
                              ? "bg-blue-500"
                              : need.value >= -999
                              ? "bg-yellow-500"
                              : need.value >= -9999
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Other categories could be added in the same pattern */}
                </>
              )}
            </TabsContent>

            <TabsContent value="personality" className="mt-0 space-y-6">
              {hasPersonality ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from<[string, number]>(
                      components.get(PersonalityComponent).traits.entries()
                    )
                      .sort(([aName], [bName]) => aName.localeCompare(bName))
                      .map(([name, value]) => (
                        <div key={name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">
                              {name.replace(/_/g, " ").toLowerCase()}
                            </span>
                            <span
                              className={
                                value >= 75
                                  ? "text-green-600 font-medium"
                                  : value >= 60
                                  ? "text-green-500"
                                  : value >= 40
                                  ? "text-blue-500"
                                  : value >= 25
                                  ? "text-yellow-500"
                                  : "text-red-500"
                              }
                            >
                              {components
                                .get(PersonalityComponent)
                                .getTraitDescription(name)}
                            </span>
                          </div>
                          <Progress
                            value={value}
                            max={100}
                            className={`h-2 ${
                              value >= 75
                                ? "bg-green-600"
                                : value >= 60
                                ? "bg-green-500"
                                : value >= 40
                                ? "bg-blue-500"
                                : value >= 25
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                          />
                        </div>
                      ))}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-md mt-4">
                    <h3 className="font-medium mb-2">Personality Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      This entity{" "}
                      {getPersonalitySummary(
                        components.get(PersonalityComponent)
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No personality data available
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
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
          <p className="text-xs text-muted-foreground">{String(error)}</p>
        </CardContent>
      </Card>
    );
  }
}

// Helper function to generate a personality summary
function getPersonalitySummary(personalityComponent: any): string {
  const traits = personalityComponent.traits;

  const highestTraits = Array.from<[string, number]>(traits.entries())
    .filter(([_, value]) => value >= 75)
    .sort(([_, aValue], [__, bValue]) => bValue - aValue)
    .slice(0, 3)
    .map(([name]) => name.replace(/_/g, " ").toLowerCase());

  const lowestTraits = Array.from<[string, number]>(traits.entries())
    .filter(([_, value]) => value <= 25)
    .sort(([_, aValue], [__, bValue]) => aValue - bValue)
    .slice(0, 3)
    .map(([name]) => name.replace(/_/g, " ").toLowerCase());

  let summary = "";

  if (highestTraits.length > 0) {
    summary += `has very high ${highestTraits.join(", ")}`;
  }

  if (highestTraits.length > 0 && lowestTraits.length > 0) {
    summary += " and ";
  }

  if (lowestTraits.length > 0) {
    summary += `has very low ${lowestTraits.join(", ")}`;
  }

  if (summary.length === 0) {
    summary = "has a balanced personality with no extreme traits";
  }

  return summary + ".";
}
