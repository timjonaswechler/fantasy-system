// src/components/materials/tabs/composite-tab.tsx
"use client";

import React from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash } from "lucide-react";
import { IMaterial } from "@/types/material";

// Interface für die Composite-Komponenten
interface CompositeComponent {
  materialId: string;
  percentage: number;
  isPrimary: boolean;
  propertyInfluence: Record<string, any>;
}

interface CompositeTabProps {
  form: UseFormReturn<any>;
  availableMaterials: IMaterial[];
  isReadOnly?: boolean;
}

export function CompositeTab({
  form,
  availableMaterials,
  isReadOnly = false,
}: CompositeTabProps) {
  const {
    fields: compositeComponentFields,
    append: appendCompositeComponent,
    remove: removeCompositeComponent,
  } = useFieldArray({
    control: form.control,
    name: "compositeComponents",
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Composite Components</h3>
        {!isReadOnly && (
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
        )}
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
                        disabled={isReadOnly}
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
                              <SelectItem key={material.id} value={material.id}>
                                {material.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isReadOnly && (
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
                )}
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
                          disabled={isReadOnly}
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
                            if (checked && !isReadOnly) {
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
                          disabled={isReadOnly}
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
              {form.getValues(`compositeComponents.${index}.materialId`) && (
                <div className="mt-4 text-sm text-muted-foreground">
                  {(() => {
                    const materialId = form.getValues(
                      `compositeComponents.${index}.materialId`
                    );
                    const material = availableMaterials.find(
                      (m) => m.id === materialId
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
          <Badge variant={"default"}>
            {(
              form
                .getValues()
                .compositeComponents?.reduce(
                  (sum: number, comp: CompositeComponent) =>
                    sum + (comp.percentage || 0),
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
