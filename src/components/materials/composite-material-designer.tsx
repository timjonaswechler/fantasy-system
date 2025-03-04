"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Loader,
  Plus,
  Trash,
  Info,
  StarIcon,
  Check,
  ArrowRight,
} from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { IMaterial, MaterialCategory } from "@/types/material";
import {
  calculateCompositeProperties,
  createCompositeMaterial,
} from "@/actions/material-composites";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Validierungsschema
const compositeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  description: z.string().optional(),
  components: z
    .array(
      z.object({
        materialId: z.string().min(1, "Material is required"),
        percentage: z.number().min(0.1).max(100),
        isPrimary: z.boolean().default(false),
        propertyInfluence: z.record(z.string(), z.number()).optional(),
      })
    )
    .min(2, "At least two components required")
    .refine((data) => {
      const sum = data.reduce((total, comp) => total + comp.percentage, 0);
      return Math.abs(sum - 100) < 0.1; // Erlaubt kleine Rundungsfehler
    }, "Percentages must sum to 100%")
    .refine((data) => {
      // Mindestens eine Komponente muss primär sein
      return data.some((comp) => comp.isPrimary);
    }, "At least one component must be marked as primary"),
});

type CompositeFormValues = z.infer<typeof compositeSchema>;

interface CompositeMaterialDesignerProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  availableMaterials: Array<{
    id: string;
    name: string;
    category: MaterialCategory;
    colorHex?: string;
    hardness?: number;
    durability?: number;
    isComposite?: boolean;
  }>;
  onSuccess?: (materialId: string) => void;
}

export function CompositeMaterialDesigner({
  availableMaterials,
  onSuccess,
  ...props
}: CompositeMaterialDesignerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedProperties, setCalculatedProperties] = useState<
    Record<string, number>
  >({});

  // Datenmodell initialisieren
  const form = useForm<CompositeFormValues>({
    resolver: zodResolver(compositeSchema),
    defaultValues: {
      name: "",
      description: "",
      components: [
        {
          materialId: "",
          percentage: 75,
          isPrimary: true,
          propertyInfluence: {},
        },
        {
          materialId: "",
          percentage: 25,
          isPrimary: false,
          propertyInfluence: {},
        },
      ],
    },
  });

  // Setup Field Array für Komponenten
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  // Überwache Änderungen an den Komponenten und berechne Eigenschaften neu
  const components = form.watch("components");

  // Effect zum Anpassen der Prozentwerte, wenn eine Komponente hinzugefügt/entfernt wird
  useEffect(() => {
    // Warte bis nach dem ersten Render und nur bei Änderungen der Array-Länge
    const totalPercentage = components.reduce(
      (sum, comp) => sum + comp.percentage,
      0
    );

    // Wenn wir genau 100% haben, ist alles gut
    if (Math.abs(totalPercentage - 100) < 0.1) {
      return;
    }

    // Andernfalls müssen wir die Prozentsätze anpassen
    const newComponents = [...components];
    const adjustmentFactor = 100 / totalPercentage;

    newComponents.forEach((comp, index) => {
      // Setze jede Komponente manuell, damit React Hook Form die Änderungen erkennt
      form.setValue(
        `components.${index}.percentage`,
        Math.round(comp.percentage * adjustmentFactor * 10) / 10
      );
    });
  }, [components.length, form]);

  // Bei jeder Änderung der Komponenten berechne die Eigenschaften neu
  useEffect(() => {
    const calculateProperties = async () => {
      try {
        // Nur berechnen, wenn alle Materialien ausgewählt wurden
        if (components.every((comp) => comp.materialId)) {
          const result = await calculateCompositeProperties(components);
          setCalculatedProperties(result);
        }
      } catch (error) {
        console.error("Error calculating properties:", error);
      }
    };

    calculateProperties();
  }, [components]);

  // Funktion zum Hinzufügen einer neuen Komponente
  const handleAddComponent = () => {
    // Berechne verfügbaren Prozentsatz (falls unter 100%)
    const currentTotal = components.reduce(
      (sum, comp) => sum + comp.percentage,
      0
    );
    const availablePercentage = Math.max(0.1, 100 - currentTotal);

    // Wenn wir bereits 100% haben, reduziere alle anderen gleichmäßig
    if (availablePercentage < 5) {
      const newComponents = [...components];
      const reduction = 10 / newComponents.length;

      newComponents.forEach((comp, index) => {
        const newValue = Math.max(0.1, comp.percentage - reduction);
        form.setValue(`components.${index}.percentage`, newValue);
      });

      append({
        materialId: "",
        percentage: 10,
        isPrimary: false,
        propertyInfluence: {},
      });
    } else {
      // Andernfalls füge mit dem verfügbaren Prozentsatz hinzu
      append({
        materialId: "",
        percentage: Math.min(10, availablePercentage),
        isPrimary: false,
        propertyInfluence: {},
      });
    }
  };

  // Funktion zum Entfernen einer Komponente
  const handleRemoveComponent = (index: number) => {
    if (components.length <= 2) {
      toast.error("At least two components are required");
      return;
    }

    const removedPercentage = components[index].percentage;
    const remainingComponents = components.length - 1;
    const distributionPerComponent = removedPercentage / remainingComponents;

    // Verteile den Prozentsatz auf die übrigen Komponenten
    const newComponents = [...components];
    newComponents.forEach((comp, i) => {
      if (i !== index) {
        const newValue = comp.percentage + distributionPerComponent;
        form.setValue(
          `components.${i}.percentage`,
          Math.round(newValue * 10) / 10
        );
      }
    });

    // Entferne die Komponente
    remove(index);
  };

  // Funktion zum Setzen einer Komponente als primär
  const handleSetPrimary = (index: number) => {
    // Setze alle auf false
    components.forEach((_, i) => {
      form.setValue(`components.${i}.isPrimary`, false);
    });

    // Setze die ausgewählte auf true
    form.setValue(`components.${index}.isPrimary`, true);
  };

  // Behandle Formular-Einreichung
  const onSubmit = async (data: CompositeFormValues) => {
    setIsSubmitting(true);

    try {
      // Ensure description is always a string, not undefined
      const formData = {
        ...data,
        description: data.description || "",
      };

      const result = await createCompositeMaterial(formData);

      if (result.success) {
        toast.success("Composite material created successfully");
        if (result.id && onSuccess) {
          onSuccess(result.id);
        }
        props.onOpenChange?.(false);
      } else {
        toast.error(result.error || "Failed to create composite material");
      }
    } catch (error) {
      console.error("Error creating composite material:", error);
      toast.error("An error occurred while creating the composite material");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet {...props}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Composite Material</SheetTitle>
          <SheetDescription>
            Design a new alloy or composite material by combining multiple
            materials.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 py-4"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Steel Alloy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A sturdy alloy composed of multiple metals..."
                        {...field}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Material Components</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddComponent}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Component
                </Button>
              </div>

              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border rounded-md p-4 relative"
                  >
                    <div className="absolute -top-3 left-4 bg-background px-2">
                      <Badge variant="outline">Component {index + 1}</Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr,100px,auto]">
                      <FormField
                        control={form.control}
                        name={`components.${index}.materialId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Material</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select material..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableMaterials
                                  .filter((m) => !m.isComposite) // Keine verschachtelten Verbundmaterialien
                                  .map((material) => (
                                    <SelectItem
                                      key={material.id}
                                      value={material.id}
                                    >
                                      {material.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`components.${index}.percentage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Percentage</FormLabel>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0.1"
                                  max="100"
                                  step="0.1"
                                  {...field}
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value);
                                    if (!isNaN(newValue)) {
                                      // Berechne, wie viel wir zu/abziehen
                                      const difference = newValue - field.value;

                                      // Wenn die Gesamtsumme 100% übersteigt, verteile den Überschuss
                                      const totalAfterChange =
                                        components.reduce(
                                          (sum, comp, i) =>
                                            sum +
                                            (i === index
                                              ? newValue
                                              : comp.percentage),
                                          0
                                        );

                                      if (totalAfterChange > 100.1) {
                                        // Zuviel, reduziere andere Komponenten proportional
                                        const excessPercentage =
                                          totalAfterChange - 100;
                                        const otherComponents =
                                          components.filter(
                                            (_, i) => i !== index
                                          );
                                        const totalOtherPercentage =
                                          otherComponents.reduce(
                                            (sum, comp) =>
                                              sum + comp.percentage,
                                            0
                                          );

                                        if (totalOtherPercentage > 0) {
                                          components.forEach((comp, i) => {
                                            if (i !== index) {
                                              const reductionFactor =
                                                comp.percentage /
                                                totalOtherPercentage;
                                              const reduction =
                                                excessPercentage *
                                                reductionFactor;
                                              const newComponentValue =
                                                Math.max(
                                                  0.1,
                                                  comp.percentage - reduction
                                                );
                                              form.setValue(
                                                `components.${i}.percentage`,
                                                Math.round(
                                                  newComponentValue * 10
                                                ) / 10
                                              );
                                            }
                                          });
                                        }
                                      }

                                      // Setze den neuen Wert
                                      field.onChange(newValue);
                                    }
                                  }}
                                />
                              </FormControl>
                              <span>%</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end gap-2 pb-1">
                        <Button
                          type="button"
                          variant={
                            components[index].isPrimary ? "default" : "outline"
                          }
                          size="sm"
                          className="h-10"
                          onClick={() => handleSetPrimary(index)}
                        >
                          {components[index].isPrimary && (
                            <Check className="mr-1 h-4 w-4" />
                          )}
                          <StarIcon className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10"
                          onClick={() => handleRemoveComponent(index)}
                          disabled={components.length <= 2}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2">
                      <FormField
                        control={form.control}
                        name={`components.${index}.percentage`}
                        render={({ field }) => (
                          <FormItem>
                            <Slider
                              value={[field.value]}
                              min={0.1}
                              max={100}
                              step={0.1}
                              onValueChange={(values) => {
                                const newValue = values[0];
                                const difference = newValue - field.value;

                                // Verteile die Differenz auf die anderen Komponenten
                                const otherComponents = components.filter(
                                  (_, i) => i !== index
                                );
                                const totalOtherPercentage =
                                  otherComponents.reduce(
                                    (sum, comp) => sum + comp.percentage,
                                    0
                                  );

                                if (totalOtherPercentage > 0) {
                                  components.forEach((comp, i) => {
                                    if (i !== index) {
                                      const reductionFactor =
                                        comp.percentage / totalOtherPercentage;
                                      const reduction =
                                        difference * reductionFactor;
                                      const newComponentValue = Math.max(
                                        0.1,
                                        comp.percentage - reduction
                                      );
                                      form.setValue(
                                        `components.${i}.percentage`,
                                        Math.round(newComponentValue * 10) / 10
                                      );
                                    }
                                  });
                                }

                                // Setze den neuen Wert
                                field.onChange(newValue);
                              }}
                              className="mt-1"
                            />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Info anzeigen, wenn Material ausgewählt wurde */}
                    {components[index].materialId && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {(() => {
                          const material = availableMaterials.find(
                            (m) => m.id === components[index].materialId
                          );

                          if (!material) return null;

                          return (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    material.colorHex || "#888888",
                                }}
                              />
                              <span>
                                {material.category} | Hardness:{" "}
                                {material.hardness || "N/A"} | Durability:{" "}
                                {material.durability || "N/A"}
                              </span>
                              {components[index].isPrimary && (
                                <Badge variant="default" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Komponenten-Gesamtprozentsatz anzeigen */}
              <div className="flex justify-between items-center text-sm">
                <span>Total percentage:</span>
                <Badge
                  variant={
                    Math.abs(
                      components.reduce(
                        (sum, comp) => sum + comp.percentage,
                        0
                      ) - 100
                    ) < 0.1
                      ? "default"
                      : "destructive"
                  }
                >
                  {components
                    .reduce((sum, comp) => sum + comp.percentage, 0)
                    .toFixed(1)}
                  %
                </Badge>
              </div>

              {/* Validierungsfehler für das gesamte components-Array anzeigen */}
              <FormMessage>
                {form.formState.errors.components?.message}
              </FormMessage>
            </div>

            {/* Vorschau der berechneten Eigenschaften */}
            {Object.keys(calculatedProperties).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Predicted Properties
                  </CardTitle>
                  <CardDescription>
                    Based on the composition, the material would have these
                    properties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(calculatedProperties).map(
                      ([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize font-medium">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <span>
                            {typeof value === "number"
                              ? Math.round(value * 100) / 100
                              : value}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Composite Material"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
