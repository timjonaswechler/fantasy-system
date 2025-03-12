"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimulationWorld } from "@/engine/simulation-world";
import { PositionComponent } from "@/engine/components/position-component";
import { AttributesComponent } from "@/engine/components/attributes-component";
import { NeedsComponent } from "@/engine/components/needs-component";
import { MovementSystem } from "@/engine/systems/movement-system";
import { EntityDetails } from "@/components/simulation/entity-details";
import { RelationshipsComponent } from "@/engine/components/relationships-component";
import { GoalsComponent } from "@/engine/components/goals-component";

// Random color generator for entities
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const SimulationPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<SimulationWorld | null>(null);
  const entityColors = useRef<Map<number, string>>(new Map());
  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [entityCount, setEntityCount] = useState(0);
  const [newEntityCount, setNewEntityCount] = useState(10);
  const animationFrameRef = useRef<number | null>(null);

  const [selectedEntity, setSelectedEntity] = useState<number | null>(null);
  const [tickCount, setTickCount] = useState(0);
  const canvasWidth = 800;
  const canvasHeight = 600;

  // Initialize the simulation world
  useEffect(() => {
    // Create the simulation world
    const world = new SimulationWorld();
    worldRef.current = world;

    // Add the movement system with canvas dimensions
    world.ecs.addSystem(new MovementSystem(canvasWidth, canvasHeight));

    // Start the simulation
    world.start();

    // Update entity count
    setEntityCount(world.getEntityCount());

    // Start rendering
    startRenderLoop();

    // Setup tick counter update
    const tickInterval = setInterval(() => {
      if (world && world.clock) {
        setTickCount(world.clock.getTickCount());
      }
    }, 500); // Update every half second

    return () => {
      // Cleanup
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(tickInterval);
    };
  }, []);

  // Rendering loop
  const startRenderLoop = () => {
    const render = () => {
      renderSimulation();
      animationFrameRef.current = requestAnimationFrame(render);
    };
    animationFrameRef.current = requestAnimationFrame(render);
  };

  // Render the simulation state
  const renderSimulation = () => {
    const canvas = canvasRef.current;
    const world = worldRef.current;

    if (!canvas || !world) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height, 50);

    // First, collect all entity positions for relationship lines
    const entityPositions = new Map();
    for (let entityId = 0; entityId < world.getEntityCount(); entityId++) {
      try {
        const components = world.ecs.getComponents(entityId);
        if (components.has(PositionComponent)) {
          const position = components.get(PositionComponent);

          // Get or create color for this entity
          if (!entityColors.current.has(entityId)) {
            entityColors.current.set(entityId, getRandomColor());
          }

          // Store position for later use
          entityPositions.set(entityId, {
            x: position.x,
            y: position.y,
            color: entityColors.current.get(entityId),
          });
        }
      } catch (error) {
        // Entity might not exist anymore, skip
      }
    }

    // Draw relationship lines between entities
    for (let entityId = 0; entityId < world.getEntityCount(); entityId++) {
      try {
        const components = world.ecs.getComponents(entityId);
        if (
          components.has(RelationshipsComponent) &&
          components.has(PositionComponent)
        ) {
          const relationships = components.get(RelationshipsComponent);
          const sourcePos = entityPositions.get(entityId);

          if (sourcePos) {
            // Draw a line for each relationship
            for (const [
              targetId,
              relation,
            ] of relationships.relationships.entries()) {
              const targetPos = entityPositions.get(targetId);
              if (targetPos) {
                drawRelationshipLine(
                  ctx,
                  sourcePos.x,
                  sourcePos.y,
                  targetPos.x,
                  targetPos.y,
                  relation.type,
                  relation.value
                );
              }
            }
          }
        }
      } catch (error) {
        // Entity might not exist anymore, skip
      }
    }

    // Now draw the entities on top of the relationship lines
    for (let entityId = 0; entityId < world.getEntityCount(); entityId++) {
      try {
        const components = world.ecs.getComponents(entityId);

        if (components.has(PositionComponent)) {
          const position = components.get(PositionComponent);
          const color = entityColors.current.get(entityId) || "#FFFFFF";

          // Determine entity size based on attributes if available
          let size = 10;
          if (components.has(AttributesComponent)) {
            const attrs = components.get(AttributesComponent);
            size = attrs.getAttribute("size") || 10;
          }

          // Draw entity
          drawEntity(ctx, position.x, position.y, size, color, entityId);
        }
      } catch (error) {
        // Entity might not exist anymore, skip
      }
    }
  };

  // Draw relationship line between entities
  const drawRelationshipLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    type: string,
    value: number
  ) => {
    // Only draw if relationship is significant
    if (Math.abs(value) < 10) return;

    // Set line style based on relationship
    if (type === "friend" || type === "friendly") {
      ctx.strokeStyle = "rgba(0, 255, 0, 0.3)"; // Green for friends
      ctx.lineWidth = 2;
    } else if (type === "enemy" || type === "hostile") {
      ctx.strokeStyle = "rgba(255, 0, 0, 0.3)"; // Red for enemies
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = "rgba(200, 200, 200, 0.2)"; // Gray for neutral
      ctx.lineWidth = 1;
    }

    // Draw the line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw small circle at midpoint to indicate relationship strength
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const radius = Math.min(Math.abs(value) / 10, 5); // Size based on relationship strength, max 5px

    if (value > 0) {
      ctx.fillStyle = "rgba(0, 255, 0, 0.5)"; // Green for positive
    } else {
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Red for negative
    }

    ctx.beginPath();
    ctx.arc(midX, midY, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw grid lines
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    spacing: number
  ) => {
    ctx.strokeStyle = "#EEEEEE";
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = 0; x <= width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Draw an entity
  const drawEntity = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    id: number
  ) => {
    const isSelected = selectedEntity === id;

    // Draw selection highlight if selected
    if (isSelected) {
      ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
      ctx.beginPath();
      ctx.arc(x, y, size + 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw entity body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // Draw border (thicker if selected)
    ctx.strokeStyle = isSelected ? "#FFD700" : "#000000";
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();

    // Draw entity ID
    ctx.fillStyle = "#000000";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${id}`, x, y);
  };

  // Pause/resume the simulation
  const togglePause = () => {
    if (!worldRef.current) return;

    if (isPaused) {
      worldRef.current.resume();
    } else {
      worldRef.current.pause();
    }

    setIsPaused(!isPaused);
  };

  // Set simulation speed
  const handleSpeedChange = (value: number[]) => {
    if (!worldRef.current) return;
    const newScale = value[0];
    worldRef.current.setSpeed(newScale);
    setTimeScale(newScale);
  };

  // Handle canvas click to select entities
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const world = worldRef.current;

    if (!canvas || !world) return;

    // Get click coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; // relationship bitmap vs. element for X
    const scaleY = canvas.height / rect.height; // relationship bitmap vs. element for Y

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check if clicked on an entity
    let foundEntity = false;
    const clickRadius = 15; // How close to entity center counts as a click

    for (let entityId = 0; entityId < world.getEntityCount(); entityId++) {
      try {
        const components = world.ecs.getComponents(entityId);

        if (components.has(PositionComponent)) {
          const position = components.get(PositionComponent);
          const size = components.has(AttributesComponent)
            ? components.get(AttributesComponent).getAttribute("size") || 10
            : 10;

          // Calculate distance from click to entity center
          const distance = Math.sqrt(
            Math.pow(position.x - x, 2) + Math.pow(position.y - y, 2)
          );

          // If click is within entity radius + clickRadius, select it
          if (distance <= size + clickRadius) {
            setSelectedEntity(entityId);
            foundEntity = true;
            break;
          }
        }
      } catch (error) {
        // Entity might not exist anymore, skip
      }
    }

    // If clicked on empty space, deselect
    if (!foundEntity) {
      setSelectedEntity(null);
    }
  };

  // Add new entities to the simulation
  const addEntities = () => {
    if (!worldRef.current) return;

    const world = worldRef.current;

    // Add the specified number of entities
    for (let i = 0; i < newEntityCount; i++) {
      // Create entities at random positions
      const x = Math.random() * canvasWidth;
      const y = Math.random() * canvasHeight;

      // Create entity with random attributes
      const entity = world.createCreature(x, y, {
        size: 5 + Math.random() * 10,
        strength: Math.random() * 100,
        speed: Math.random() * 100,
        intelligence: Math.random() * 100,
        curiosity: Math.random() * 100,
        charisma: Math.random() * 100,
      });
    }

    // Update entity count
    setEntityCount(world.getEntityCount());
  };

  return (
    <Shell className="gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Simulation World
          </h1>
          <p className="text-muted-foreground">ECS-based entity simulation</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Tick: {tickCount}
          </Badge>
          <Badge variant={isPaused ? "outline" : "default"} className="text-sm">
            {isPaused ? "Paused" : "Running"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="simulation" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="details">Entity Details</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="simulation" className="w-full">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main simulation canvas */}
            <div className="xl:col-span-3 bg-white rounded-lg border border-border overflow-hidden">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="w-full h-full"
                onClick={handleCanvasClick}
              ></canvas>
            </div>

            {/* Controls sidebar */}
            <div className="space-y-6">
              {/* Simulation info */}
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Info</CardTitle>
                  <CardDescription>
                    Current state of the simulation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={isPaused ? "outline" : "default"}>
                      {isPaused ? "Paused" : "Running"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <span>{timeScale}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entities:</span>
                    <span>{entityCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Selected:</span>
                    <span>
                      {selectedEntity !== null ? `#${selectedEntity}` : "None"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Simulation controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Controls</CardTitle>
                  <CardDescription>Manage the simulation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={togglePause}
                    variant={isPaused ? "default" : "outline"}
                    className="w-full"
                  >
                    {isPaused ? "Resume" : "Pause"}
                  </Button>

                  <div className="space-y-2">
                    <Label>Simulation Speed</Label>
                    <Slider
                      value={[timeScale]}
                      min={0.1}
                      max={5}
                      step={0.1}
                      onValueChange={handleSpeedChange}
                    />
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label>Add Entities</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={newEntityCount}
                        onChange={(e) =>
                          setNewEntityCount(parseInt(e.target.value) || 1)
                        }
                      />
                      <Button onClick={addEntities}>Add</Button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label>Entity Interaction</Label>
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          if (!worldRef.current) return;

                          // Force all entities to add a "socialize" goal
                          const world = worldRef.current;
                          for (
                            let entityId = 0;
                            entityId < world.getEntityCount();
                            entityId++
                          ) {
                            try {
                              const components =
                                world.ecs.getComponents(entityId);
                              if (components.has(GoalsComponent)) {
                                const goals = components.get(GoalsComponent);
                                if (
                                  !goals.goals.some((g) => g.id === "socialize")
                                ) {
                                  goals.addGoal("socialize", 5); // High priority
                                }
                              }
                            } catch (error) {
                              // Entity might not exist anymore
                            }
                          }

                          toast.success(
                            "Added socialize goals to all entities"
                          );
                        }}
                        className="w-full"
                        variant="outline"
                      >
                        Encourage Socializing
                      </Button>

                      <Button
                        onClick={() => {
                          // Force nearby entities to form relationships
                          if (!worldRef.current) return;

                          const world = worldRef.current;
                          const entityCount = world.getEntityCount();
                          let relationshipsFormed = 0;

                          // Create relationships between nearby entities
                          for (let idA = 0; idA < entityCount; idA++) {
                            for (let idB = idA + 1; idB < entityCount; idB++) {
                              try {
                                const componentsA =
                                  world.ecs.getComponents(idA);
                                const componentsB =
                                  world.ecs.getComponents(idB);

                                if (
                                  componentsA.has(PositionComponent) &&
                                  componentsB.has(PositionComponent) &&
                                  componentsA.has(RelationshipsComponent) &&
                                  componentsB.has(RelationshipsComponent)
                                ) {
                                  const posA =
                                    componentsA.get(PositionComponent);
                                  const posB =
                                    componentsB.get(PositionComponent);

                                  // Calculate distance
                                  const distance = Math.sqrt(
                                    Math.pow(posA.x - posB.x, 2) +
                                      Math.pow(posA.y - posB.y, 2)
                                  );

                                  // If close enough, create a relationship
                                  if (distance < 150) {
                                    const relA = componentsA.get(
                                      RelationshipsComponent
                                    );
                                    const relB = componentsB.get(
                                      RelationshipsComponent
                                    );

                                    // Check if relationship doesn't exist yet
                                    const existingRel =
                                      relA.getRelationship(idB);
                                    if (!existingRel) {
                                      // Random relationship type
                                      const relationTypes = [
                                        "friendly",
                                        "neutral",
                                        "hostile",
                                      ];
                                      const randomType =
                                        relationTypes[
                                          Math.floor(
                                            Math.random() * relationTypes.length
                                          )
                                        ];

                                      // Initial relationship value
                                      const initialValue =
                                        randomType === "friendly"
                                          ? 20
                                          : randomType === "hostile"
                                          ? -20
                                          : 0;

                                      // Create two-way relationship
                                      relA.addRelationship(
                                        idB,
                                        randomType,
                                        initialValue
                                      );
                                      relB.addRelationship(
                                        idA,
                                        randomType,
                                        initialValue
                                      );
                                      relationshipsFormed++;
                                    }
                                  }
                                }
                              } catch (error) {
                                // Entity might not exist anymore
                              }
                            }
                          }

                          toast.success(
                            `Formed ${relationshipsFormed} new entity relationships!`
                          );
                        }}
                        className="w-full"
                      >
                        Form Relationships
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Legend */}
              <Card>
                <CardHeader>
                  <CardTitle>Legend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Entities</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>High need level</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Medium need level</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Low need level (critical)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-yellow-400 rounded-full"></div>
                        <span>Selected entity</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Relationships</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0 border-t-2 border-green-300"></div>
                        <span>Friendly relationship</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0 border-t-2 border-red-300"></div>
                        <span>Hostile relationship</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0 border-t border-gray-300"></div>
                        <span>Neutral relationship</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        <span>Positive sentiment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <span>Negative sentiment</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entity details panel */}
            <EntityDetails entity={selectedEntity} world={worldRef.current} />
            {/* Instructions card */}
            <Card>
              <CardHeader>
                <CardTitle>Entity Interaction</CardTitle>
                <CardDescription>
                  How to interact with simulation entities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Selecting Entities</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on any entity in the simulation view to select it and
                    view its details. Selected entities will be highlighted with
                    a yellow border.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Entity Components</h3>
                  <p className="text-sm text-muted-foreground">
                    Each entity can have various components that define its
                    behavior and state:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>
                      <span className="font-medium">Position</span> -
                      Coordinates in the world
                    </li>
                    <li>
                      <span className="font-medium">Attributes</span> - Core
                      characteristics like strength, speed
                    </li>
                    <li>
                      <span className="font-medium">Needs</span> - Requirements
                      like hunger or energy
                    </li>
                    <li>
                      <span className="font-medium">Goals</span> - Current
                      objectives the entity is pursuing
                    </li>
                    <li>
                      <span className="font-medium">Relationships</span> -
                      Connections to other entities
                    </li>
                    <li>
                      <span className="font-medium">Memory</span> - Record of
                      past events and experiences
                    </li>
                  </ul>
                </div>

                <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-200">
                  <p>
                    <strong>Tip:</strong> To see entity details, first select an
                    entity by clicking on it in the Simulation tab, then switch
                    to the Details tab.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Simulation Statistics</CardTitle>
                <CardDescription>
                  Overview of the current simulation state
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Total Entities
                    </p>
                    <p className="text-2xl font-bold">{entityCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Simulation Ticks
                    </p>
                    <p className="text-2xl font-bold">{tickCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Time Scale</p>
                    <p className="text-2xl font-bold">{timeScale}x</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-2xl font-bold">
                      {isPaused ? "Paused" : "Running"}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="font-medium mb-2">Performance Metrics</h3>
                  <p className="text-sm text-muted-foreground">
                    In a full implementation, this section would show metrics
                    like frame rate, update times, and memory usage to help
                    optimize the simulation.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About ECS Architecture</CardTitle>
                <CardDescription>
                  How the simulation engine works
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  This simulation uses an Entity Component System (ECS)
                  architecture, which separates data (Components) from logic
                  (Systems) for better performance and modularity.
                </p>

                <div className="space-y-2">
                  <h3 className="font-medium text-foreground">
                    Core Components
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <span className="font-medium text-foreground">
                        Entity
                      </span>{" "}
                      - Simple numeric IDs
                    </li>
                    <li>
                      <span className="font-medium text-foreground">
                        Components
                      </span>{" "}
                      - Pure data containers
                    </li>
                    <li>
                      <span className="font-medium text-foreground">
                        Systems
                      </span>{" "}
                      - Logic that operates on entities
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-foreground">
                    Active Systems
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <span className="font-medium text-foreground">
                        Need System
                      </span>{" "}
                      - Manages hunger, energy, etc.
                    </li>
                    <li>
                      <span className="font-medium text-foreground">
                        Movement System
                      </span>{" "}
                      - Controls entity movement
                    </li>
                    <li>
                      <span className="font-medium text-foreground">
                        Goal System
                      </span>{" "}
                      - Manages goal-directed behavior
                    </li>
                    <li>
                      <span className="font-medium text-foreground">
                        Relationship System
                      </span>{" "}
                      - Handles social dynamics
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Shell>
  );
};

export default SimulationPage;
