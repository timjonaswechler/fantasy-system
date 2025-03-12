// EntityDetailsPanel.tsx
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Entity } from "@/engine/ecs";

interface Need {
  name: string;
  state: string;
  value: number;
}

interface EntityDetailsPanelProps {
  entity: Entity | null;
  world: any; // SimulationWorld instance
}

export function EntityDetails({ entity, world }: EntityDetailsPanelProps) {
  if (!entity || !world) {
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

  // Get entity details from simulation world
  const details = world.getEntityDetails(entity);

  if (!details) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entity Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading entity #{entity}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Entity #{entity}</CardTitle>
          {details.needs && (
            <Badge
              variant={
                details.needs.focus >= 120
                  ? "default"
                  : details.needs.focus >= 100
                  ? "outline"
                  : details.needs.focus >= 80
                  ? "secondary"
                  : "destructive"
              }
            >
              {details.needs.focusDescription}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="attributes">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="attributes" className="flex-1">
              Attributes
            </TabsTrigger>
            <TabsTrigger value="needs" className="flex-1">
              Needs
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex-1">
              Goals
            </TabsTrigger>
            <TabsTrigger value="social" className="flex-1">
              Social
            </TabsTrigger>
          </TabsList>
          {/* Attributes Tab */}
          <TabsContent value="attributes" className="mt-0">
            <Tabs defaultValue="physical">
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="physical" className="flex-1">
                  Physical
                </TabsTrigger>
                <TabsTrigger value="mental" className="flex-1">
                  Mental
                </TabsTrigger>
                <TabsTrigger value="social" className="flex-1">
                  Social
                </TabsTrigger>
              </TabsList>

              {/* Physical Attributes */}
              <TabsContent value="physical" className="mt-0 p-4">
                <ScrollArea className="h-[400px] pr-3">
                  {details.attributes &&
                    details.attributes.physical &&
                    Object.entries(details.attributes.physical).map(
                      ([name, attr]: [string, any]) => (
                        <div key={name} className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">
                              {name.replace(/_/g, " ")}
                            </span>
                            <span
                              className={getAttributeColorClass(attr.value)}
                            >
                              {attr.value}
                              {attr.description && ` (${attr.description})`}
                            </span>
                          </div>
                          <Progress
                            value={attr.value}
                            max={5000}
                            className="h-2"
                          />
                        </div>
                      )
                    )}
                </ScrollArea>
              </TabsContent>

              {/* Mental Attributes */}
              <TabsContent value="mental" className="mt-0 p-4">
                <ScrollArea className="h-[400px] pr-3">
                  {details.attributes &&
                    details.attributes.mental &&
                    Object.entries(details.attributes.mental).map(
                      ([name, attr]: [string, any]) => (
                        <div key={name} className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">
                              {name.replace(/_/g, " ")}
                            </span>
                            <span
                              className={getAttributeColorClass(attr.value)}
                            >
                              {attr.value}
                              {attr.description && ` (${attr.description})`}
                            </span>
                          </div>
                          <Progress
                            value={attr.value}
                            max={5000}
                            className="h-2"
                          />
                        </div>
                      )
                    )}
                </ScrollArea>
              </TabsContent>

              {/* Social Attributes */}
              <TabsContent value="social" className="mt-0 p-4">
                <ScrollArea className="h-[400px] pr-3">
                  {details.attributes &&
                    details.attributes.social &&
                    Object.entries(details.attributes.social).map(
                      ([name, attr]: [string, any]) => (
                        <div key={name} className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">
                              {name.replace(/_/g, " ")}
                            </span>
                            <span
                              className={getAttributeColorClass(attr.value)}
                            >
                              {attr.value}
                              {attr.description && ` (${attr.description})`}
                            </span>
                          </div>
                          <Progress
                            value={attr.value}
                            max={5000}
                            className="h-2"
                          />
                        </div>
                      )
                    )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Needs Tab */}
          <TabsContent value="needs" className="mt-0 p-4">
            <ScrollArea className="h-[400px] pr-3">
              {details.needs &&
                details.needs.critical &&
                details.needs.critical.map((need: Need, index: number) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{need.name}</span>
                      <span className={getNeedStateColor(need.state)}>
                        {need.state}
                      </span>
                    </div>
                    <Progress
                      value={Math.max(0, need.value)}
                      max={400}
                      className="h-2"
                    />
                  </div>
                ))}
            </ScrollArea>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="mt-0 p-4">
            <ScrollArea className="h-[400px] pr-3">
              {details.goals && details.goals.length > 0 ? (
                details.goals.map(
                  (
                    goal: {
                      id: string;
                      priority: number;
                      progress: number;
                    },
                    index: number
                  ) => (
                    <div key={index} className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">
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
                  )
                )
              ) : (
                <p className="text-muted-foreground">No active goals</p>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="mt-0">
            <div className="h-[400px] pr-3">
              {details.relationships && details.relationships.length > 0 ? (
                details.relationships.map(
                  (
                    rel: { targetId: number; type: string; value: number },
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-md mb-2"
                    >
                      <div>
                        <div className="font-medium">
                          Entity #{rel.targetId}
                        </div>
                        <div className={getRelationshipColorClass(rel.value)}>
                          {rel.type} ({rel.value > 0 ? "+" : ""}
                          {rel.value})
                        </div>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${getRelationshipDotColor(
                          rel.type
                        )}`}
                      ></div>
                    </div>
                  )
                )
              ) : (
                <p className="text-muted-foreground">No relationships</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper functions for styling
function getAttributeColorClass(value: number): string {
  if (value >= 2000) return "text-green-600 font-semibold";
  if (value >= 1500) return "text-green-500";
  if (value >= 1250) return "text-blue-500";
  if (value >= 1000) return "text-blue-400";
  if (value >= 750) return "text-gray-500";
  if (value >= 500) return "text-yellow-500";
  if (value >= 250) return "text-orange-500";
  return "text-red-500";
}

function getNeedStateColor(state: string): string {
  switch (state) {
    case "Unfettered":
      return "text-green-600 font-semibold";
    case "Level-headed":
      return "text-green-500";
    case "Untroubled":
      return "text-blue-500";
    case "Not distracted":
      return "text-blue-400";
    case "Unfocused":
      return "text-yellow-500";
    case "Distracted":
      return "text-orange-500";
    case "Badly distracted":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

function getRelationshipColorClass(value: number): string {
  if (value >= 50) return "text-green-600";
  if (value >= 20) return "text-green-500";
  if (value > -20) return "text-gray-500";
  if (value > -50) return "text-orange-500";
  return "text-red-500";
}

function getRelationshipDotColor(type: string): string {
  switch (type) {
    case "friend":
      return "bg-green-600";
    case "friendly":
      return "bg-green-400";
    case "neutral":
      return "bg-gray-400";
    case "hostile":
      return "bg-orange-500";
    case "enemy":
      return "bg-red-600";
    default:
      return "bg-gray-300";
  }
}
