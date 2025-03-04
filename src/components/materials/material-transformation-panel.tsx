"use client";

import React from "react";
import {
  MaterialTransformation,
  TransformationResult,
  TimeUnit,
  PerformTransformationParams,
} from "@/types/material-transformation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowRight,
  Flame,
  Timer,
  Hammer,
  Percent,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialTransformationPanelProps {
  transformations: MaterialTransformation[];
  onTransform?: (result: TransformationResult) => void;
  direction?: "source" | "target" | "both";
  className?: string;
}

export function MaterialTransformationPanel({
  transformations,
  onTransform,
  direction = "both",
  className,
}: MaterialTransformationPanelProps) {
  // State für die Transformationsmenge
  const [transformQuantity, setTransformQuantity] = React.useState<
    Record<string, number>
  >(Object.fromEntries(transformations.map((t) => [t.id, 1])));

  // State für die laufende Transformation
  const [isTransforming, setIsTransforming] = React.useState<string | null>(
    null
  );

  // Funktion zum Durchführen einer Transformation
  const handleTransform = async (transformationId: string) => {
    try {
      setIsTransforming(transformationId);

      const quantity = transformQuantity[transformationId] || 1;

      const result = await performTransformation({
        transformationId,
        quantity,
      });

      if (result.success) {
        toast.success(
          `Successfully transformed ${quantity} units to produce ${
            result.yieldAmount
          } units of ${
            typeof result.targetMaterial === "string"
              ? result.targetMaterial
              : result.targetMaterial?.name
          }`
        );

        // Callback aufrufen, falls vorhanden
        onTransform?.(result);
      } else {
        toast.error(result.error || "Failed to perform transformation");
      }
    } catch (error) {
      console.error("Error during transformation:", error);
      toast.error("An error occurred during transformation");
    } finally {
      setIsTransforming(null);
    }
  };

  // Icon-Mapping für Transformationstypen
  const getTransformationIcon = (type: string) => {
    switch (type) {
      case "SMELTING":
        return Flame;
      case "ALLOYING":
        return Hammer;
      default:
        return ArrowRight;
    }
  };

  // Funktion zum Formatieren der Verarbeitungszeit
  const formatProcessingTime = (time?: number, unit?: TimeUnit): string => {
    if (!time || !unit) return "No time requirement";

    switch (unit) {
      case TimeUnit.MINUTES:
        return time === 1 ? "1 minute" : `${time} minutes`;
      case TimeUnit.HOURS:
        return time === 1 ? "1 hour" : `${time} hours`;
      case TimeUnit.DAYS:
        return time === 1 ? "1 day" : `${time} days`;
      default:
        return `${time} ${unit.toLowerCase()}`;
    }
  };

  // Filter Transformationen je nach 'direction' Parameter
  const filteredTransformations = transformations.filter((t) => {
    if (direction === "both") return true;
    if (direction === "source" && typeof t.sourceMaterial === "object")
      return true;
    if (direction === "target" && typeof t.targetMaterial === "object")
      return true;
    return false;
  });

  if (filteredTransformations.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-medium">Material Transformations</h3>

      <div className="space-y-2">
        {filteredTransformations.map((transformation) => {
          const Icon = getTransformationIcon(transformation.type);

          return (
            <div key={transformation.id} className="border rounded-md p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {transformation.type.replace("_", " ")}
                  </Badge>
                  {transformation.requiredTemperature && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Flame className="h-3 w-3" />
                      {transformation.requiredTemperature}°C
                    </Badge>
                  )}
                  {transformation.processingTime && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Timer className="h-3 w-3" />
                      {formatProcessingTime(
                        transformation.processingTime,
                        transformation.timeUnit
                      )}
                    </Badge>
                  )}
                  {transformation.requiredTool && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Hammer className="h-3 w-3" />
                      {transformation.requiredTool}
                    </Badge>
                  )}
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Transform
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Perform Transformation</DialogTitle>
                      <DialogDescription>
                        Transform{" "}
                        {typeof transformation.sourceMaterial === "string"
                          ? transformation.sourceMaterial
                          : transformation.sourceMaterial.name}{" "}
                        into{" "}
                        {typeof transformation.targetMaterial === "string"
                          ? transformation.targetMaterial
                          : transformation.targetMaterial.name}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-medium">
                          {typeof transformation.sourceMaterial === "string"
                            ? transformation.sourceMaterial
                            : transformation.sourceMaterial.name}
                        </div>
                        <Icon className="mx-4 text-muted-foreground" />
                        <div className="font-medium">
                          {typeof transformation.targetMaterial === "string"
                            ? transformation.targetMaterial
                            : transformation.targetMaterial.name}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor={`quantity-${transformation.id}`}
                            className="block text-sm font-medium mb-1"
                          >
                            Quantity to transform
                          </label>
                          <Input
                            id={`quantity-${transformation.id}`}
                            type="number"
                            min="1"
                            value={transformQuantity[transformation.id] || 1}
                            onChange={(e) =>
                              setTransformQuantity({
                                ...transformQuantity,
                                [transformation.id]: Math.max(
                                  1,
                                  parseInt(e.target.value) || 1
                                ),
                              })
                            }
                          />
                        </div>

                        <div className="text-sm">
                          <p className="font-medium">Process details:</p>
                          <ul className="mt-1 space-y-1">
                            <li className="flex items-center gap-2">
                              <Percent className="h-4 w-4 text-muted-foreground" />
                              Yield: {transformation.yieldPercentage}%
                            </li>
                            {transformation.requiredTemperature && (
                              <li className="flex items-center gap-2">
                                <Flame className="h-4 w-4 text-muted-foreground" />
                                Required temperature:{" "}
                                {transformation.requiredTemperature}°C
                              </li>
                            )}
                            {transformation.processingTime && (
                              <li className="flex items-center gap-2">
                                <Timer className="h-4 w-4 text-muted-foreground" />
                                Processing time:{" "}
                                {formatProcessingTime(
                                  transformation.processingTime,
                                  transformation.timeUnit
                                )}
                              </li>
                            )}
                            {transformation.requiredTool && (
                              <li className="flex items-center gap-2">
                                <Hammer className="h-4 w-4 text-muted-foreground" />
                                Required tool: {transformation.requiredTool}
                              </li>
                            )}
                          </ul>
                        </div>

                        {transformation.description && (
                          <div className="text-sm">
                            <p>{transformation.description}</p>
                          </div>
                        )}

                        {/* Berechnetes Ergebnis anzeigen */}
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm">
                            Expected output:
                            <span className="font-medium ml-1">
                              {(
                                ((transformQuantity[transformation.id] || 1) *
                                  transformation.yieldPercentage) /
                                100
                              ).toFixed(1)}{" "}
                              units
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleTransform(transformation.id)}
                        disabled={isTransforming === transformation.id}
                      >
                        {isTransforming === transformation.id && (
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Transform
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <span className="font-medium">
                      {typeof transformation.sourceMaterial === "string"
                        ? transformation.sourceMaterial
                        : transformation.sourceMaterial.name}
                    </span>
                    <ArrowRight className="mx-2 h-4 w-4" />
                    <span className="font-medium">
                      {typeof transformation.targetMaterial === "string"
                        ? transformation.targetMaterial
                        : transformation.targetMaterial.name}
                    </span>
                  </div>
                  {transformation.description && (
                    <p className="mt-1">{transformation.description}</p>
                  )}
                </div>
                <div className="text-sm">
                  <span className="flex items-center text-muted-foreground">
                    <Percent className="mr-1 h-4 w-4" />
                    Yield: {transformation.yieldPercentage}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
