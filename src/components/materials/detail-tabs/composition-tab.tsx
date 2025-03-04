// src/components/materials/tabs/composition-tab.tsx
import React from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash } from "lucide-react";
import { IMaterial } from "@/types/material";
import { CompositeMaterial } from "@/types/material-composite";

interface CompositionTabProps {
  form?: UseFormReturn<any>;
  material?: IMaterial;
  availableMaterials?: IMaterial[];
  isReadOnly?: boolean;
  isEditable?: boolean; // If true, we're in edit mode with form
}

export function CompositionTab({
  form,
  material,
  availableMaterials = [],
  isReadOnly = false,
  isEditable = false,
}: CompositionTabProps) {
  const hasComponents =
    (material && material.isComposite && "components" in material) ||
    (form && form.getValues().compositeComponents?.length > 0);

  // Setup field array for composite components if applicable
  const {
    fields: compositeComponentFields,
    append: appendCompositeComponent,
    remove: removeCompositeComponent,
  } = useFieldArray({
    control: form?.control,
    name: "compositeComponents",
  });

  if (isReadOnly && material?.isComposite && "components" in material) {
    const compositeMaterial = material as CompositeMaterial;

    return (
      <div className="space-y-6">
        <Separator />

        <h3 className="text-lg font-medium mb-4">Material Composition</h3>

        <div className="space-y-4">
          {compositeMaterial.components?.map((component, index) => (
            <div key={index} className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor:
                        typeof component.material === "string"
                          ? "#888888"
                          : component.material.colorHex || "#888888",
                    }}
                  />
                  <span className="font-medium">
                    {typeof component.material === "string"
                      ? component.material
                      : component.material.name}
                  </span>
                  {component.isPrimary && (
                    <Badge variant="default" className="text-xs">
                      Primary
                    </Badge>
                  )}
                </div>
                <Badge variant="outline">
                  {component.percentage.toFixed(1)}%
                </Badge>
              </div>

              {typeof component.material !== "string" && (
                <div className="text-sm text-muted-foreground">
                  <span>
                    {component.material.category} | Hardness:{" "}
                    {component.material.hardness || "N/A"} | Durability:{" "}
                    {component.material.durability || "N/A"}
                  </span>
                </div>
              )}

              {/* Show property influences */}
              {component.propertyInfluence &&
                Object.keys(component.propertyInfluence).length > 0 && (
                  <div className="mt-2 text-xs">
                    <p className="font-medium">Property influences:</p>
                    <div className="grid grid-cols-2 gap-x-4 mt-1">
                      {Object.entries(component.propertyInfluence).map(
                        ([property, value]) => (
                          <div key={property} className="flex justify-between">
                            <span className="capitalize">{property}</span>
                            <span>
                              {value > 1
                                ? `+${((value - 1) * 100).toFixed(0)}%`
                                : `-${((1 - value) * 100).toFixed(0)}%`}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-muted rounded-md">
          <p className="text-sm">
            <span className="font-medium">Composition effect:</span> This
            composite material combines the properties of its components, with
            the primary component defining the base characteristics.
          </p>
        </div>
      </div>
    );
  }

  if (isEditable && form) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Composite Components</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendCompositeComponent({
                materialId: "",
                percentage: 10,
                isPrimary: false,
                propertyInfluence: {},
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Component
          </Button>
        </div>

        {compositeComponentFields.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No components added. This doesn't appear to be a composite material.
          </div>
        ) : (
          <div className="space-y-4">
            {compositeComponentFields.map((field, index) => (
              <div key={field.id} className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <FormField
                    control={form.control}
                    name={`compositeComponents.${index}.materialId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Material</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableMaterials
                              .filter((m) => !m.isComposite) // Prevent nesting composites
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

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCompositeComponent(index)}
                    className="ml-2"
                    disabled={compositeComponentFields.length <= 1}
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`compositeComponents.${index}.percentage`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentage</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0.1"
                            max="100"
                            step="0.1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`compositeComponents.${index}.isPrimary`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              // If checked, uncheck all other components
                              if (checked) {
                                compositeComponentFields.forEach((_, i) => {
                                  if (i !== index) {
                                    form.setValue(
                                      `compositeComponents.${i}.isPrimary`,
                                      false
                                    );
                                  }
                                });
                              }
                              field.onChange(checked);
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Primary Component</FormLabel>
                          <FormDescription>
                            Defines the base characteristics
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Display info about the selected material */}
                {field.materialId && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    {(() => {
                      const material = availableMaterials.find(
                        (m) => m.id === field.materialId
                      );

                      if (!material) return <p>Material not found</p>;

                      return (
                        <div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: material.colorHex || "#888888",
                              }}
                            />
                            <span>
                              {material.category} | Hardness:{" "}
                              {material.hardness || "N/A"} | Durability:{" "}
                              {material.durability || "N/A"}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Display the total percentage */}
        {compositeComponentFields.length > 0 && (
          <div className="flex justify-between items-center text-sm mt-4">
            <span>Total percentage:</span>
            <Badge
              variant={
                Math.abs(
                  form
                    .getValues()
                    .compositeComponents?.reduce(
                      (sum, comp) => sum + (comp.percentage || 0),
                      0
                    ) || 0 - 100
                ) < 0.1
                  ? "default"
                  : "destructive"
              }
            >
              {(
                form
                  .getValues()
                  .compositeComponents?.reduce(
                    (sum, comp) => sum + (comp.percentage || 0),
                    0
                  ) || 0
              ).toFixed(1)}
              %
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Default fallback if no appropriate mode is found
  return (
    <div className="text-center py-8 text-muted-foreground">
      {hasComponents
        ? "Loading composition data..."
        : "This material doesn't have composition data."}
    </div>
  );
}
