"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart2,
  Weight,
  DollarSign,
  Sparkles,
  Flame,
  Thermometer,
  Droplet,
  Edit,
  Trash,
} from "lucide-react";
import { IMaterial, MaterialCategory, MaterialState } from "@/types/material";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

interface MaterialDetailSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  material: IMaterial | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MaterialDetailSheet({
  material,
  onEdit,
  onDelete,
  ...props
}: MaterialDetailSheetProps) {
  if (!material) return null;

  // Prepare data for radar chart
  const getPropertyValue = (propertyName: string): number => {
    const value = material[propertyName as keyof IMaterial];
    if (typeof value === "number") return value;
    return 0;
  };

  const radarData = [
    {
      property: "Hardness",
      value: getPropertyValue("hardness") || 0,
      fullMark: 100,
    },
    {
      property: "Durability",
      value: getPropertyValue("durability") || 0,
      fullMark: 100,
    },
    {
      property: "Sharpness",
      value: getPropertyValue("sharpness") || 0,
      fullMark: 100,
    },
    {
      property: "Value",
      value: (getPropertyValue("valueModifier") || 1) * 50,
      fullMark: 100,
    },
    {
      property: "Density",
      value: Math.min((getPropertyValue("density") || 0) / 100, 100),
      fullMark: 100,
    },
  ];

  return (
    <Sheet {...props}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex justify-between items-center">
            <div>
              <SheetTitle className="text-2xl">{material.name}</SheetTitle>
              <div className="flex items-center mt-1">
                <Badge
                  variant="outline"
                  className="capitalize"
                  style={{
                    backgroundColor: material.colorHex || undefined,
                  }}
                >
                  {material.category}
                </Badge>
                {material.isMagical && (
                  <Badge variant="secondary" className="ml-2">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Magical
                  </Badge>
                )}
                {material.isRare && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-amber-500 border-amber-500"
                  >
                    Rare
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <SheetDescription className="mt-2">
            {material.description}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center">
              <BarChart2 className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Hardness:</span>
              <span className="ml-2">
                {material.hardness || "Not specified"}
              </span>
            </div>

            <div className="flex items-center">
              <Weight className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Density:</span>
              <span className="ml-2">
                {material.density
                  ? `${material.density} kg/m³`
                  : "Not specified"}
              </span>
            </div>

            <div className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Value Modifier:</span>
              <span className="ml-2">×{material.valueModifier.toFixed(2)}</span>
            </div>

            <div className="flex items-center">
              <Thermometer className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Melting Point:</span>
              <span className="ml-2">
                {material.meltingPoint
                  ? `${material.meltingPoint}°C`
                  : "Not specified"}
              </span>
            </div>

            <div className="flex items-center">
              <Flame className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Ignite Point:</span>
              <span className="ml-2">
                {material.ignitePoint
                  ? `${material.ignitePoint}°C`
                  : "Not specified"}
              </span>
            </div>

            <div className="flex items-center">
              <Droplet className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Sharpness:</span>
              <span className="ml-2">
                {material.sharpness || "Not specified"}
              </span>
            </div>
          </div>

          {/* Durability bar */}
          {material.durability !== undefined && (
            <div className="w-full space-y-2">
              <h3 className="font-medium mb-1">Durability</h3>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    material.durability > 75
                      ? "bg-emerald-500"
                      : material.durability > 50
                      ? "bg-amber-500"
                      : material.durability > 25
                      ? "bg-orange-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${material.durability}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground">
                {material.durability}/100
                {material.durability > 90
                  ? " (Exceptional)"
                  : material.durability > 75
                  ? " (Excellent)"
                  : material.durability > 50
                  ? " (Good)"
                  : material.durability > 25
                  ? " (Poor)"
                  : " (Very Poor)"}
              </p>
            </div>
          )}

          {/* Properties Radar Chart */}
          <div className="mt-4">
            <h3 className="font-medium mb-2">Material Properties:</h3>
            <div className="border rounded-md p-4 bg-card">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={radarData}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="property" />
                  <Radar
                    name={material.name}
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Material States */}
          {material.states && material.states.size > 0 && (
            <div>
              <h3 className="font-medium mb-2">Material States:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Array.from(material.states.entries()).map(
                  ([state, stateData]) => (
                    <div key={state} className="border rounded-md p-3">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: stateData.color || "#888888",
                          }}
                        ></div>
                        <span className="font-medium capitalize">
                          {state.toLowerCase()}
                        </span>
                      </div>
                      {stateData.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {stateData.description}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Additional Properties */}
          {material.properties && material.properties.size > 0 && (
            <div>
              <h3 className="font-medium mb-2">Additional Properties:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Array.from(material.properties.entries()).map(
                  ([key, value]) => (
                    <div key={key} className="border rounded-md p-3">
                      <span className="font-medium">{key}:</span> {value}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Source Information */}
          {(material.sourceLocation ||
            material.sourceCreature ||
            material.sourcePlant) && (
            <div>
              <h3 className="font-medium mb-2">Source Information:</h3>
              <div className="space-y-2">
                {material.sourceLocation && (
                  <div className="flex items-start">
                    <span className="font-medium min-w-24">Location:</span>
                    <span>{material.sourceLocation}</span>
                  </div>
                )}
                {material.sourceCreature && (
                  <div className="flex items-start">
                    <span className="font-medium min-w-24">Creature:</span>
                    <span>{material.sourceCreature}</span>
                  </div>
                )}
                {material.sourcePlant && (
                  <div className="flex items-start">
                    <span className="font-medium min-w-24">Plant:</span>
                    <span>{material.sourcePlant}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Physical Properties */}
          <div>
            <h3 className="font-medium mb-2">Physical Properties:</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="border rounded-md p-3">
                  <span className="font-medium">Impact Yield:</span>
                  <span className="block text-sm">
                    {material.impactYield || "Not specified"}
                  </span>
                </div>
                <div className="border rounded-md p-3">
                  <span className="font-medium">Impact Fracture:</span>
                  <span className="block text-sm">
                    {material.impactFracture || "Not specified"}
                  </span>
                </div>
                <div className="border rounded-md p-3">
                  <span className="font-medium">Shear Yield:</span>
                  <span className="block text-sm">
                    {material.shearYield || "Not specified"}
                  </span>
                </div>
                <div className="border rounded-md p-3">
                  <span className="font-medium">Shear Fracture:</span>
                  <span className="block text-sm">
                    {material.shearFracture || "Not specified"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Created date */}
          <div className="text-xs text-muted-foreground text-right">
            Created: {material.createdAt.toLocaleDateString()}
          </div>
        </div>

        <SheetFooter className="flex gap-2 pt-6 border-t mt-6">
          <Button onClick={onEdit} variant="outline">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button onClick={onDelete} variant="destructive">
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
          <SheetClose asChild>
            <Button variant="secondary">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
