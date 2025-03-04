// src/components/materials/tabs/custom-properties-tab.tsx
import React from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface CustomPropertiesTabProps {
  form: UseFormReturn<any>;
  isReadOnly?: boolean;
}

export function CustomPropertiesTab({
  form,
  isReadOnly = false,
}: CustomPropertiesTabProps) {
  // Set up field array for properties
  const {
    fields: propertyFields,
    append: appendProperty,
    remove: removeProperty,
  } = useFieldArray({
    control: form.control,
    name: "properties",
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Custom Properties</h3>
        {!isReadOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendProperty({ name: "", value: "" })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        )}
      </div>

      {propertyFields.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          No custom properties added yet.
          {!isReadOnly && 'Click "Add Property" to create one.'}
        </div>
      ) : (
        <div className="space-y-4">
          {propertyFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <FormField
                control={form.control}
                name={`properties.${index}.name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Property name"
                        {...field}
                        readOnly={isReadOnly}
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`properties.${index}.value`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">Value</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Property value"
                        {...field}
                        readOnly={isReadOnly}
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProperty(index)}
                  className="mt-1"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!isReadOnly && (
        <div className="text-sm text-muted-foreground mt-4">
          <p>
            Custom properties allow you to add any additional data about this
            material.
          </p>
          <p>
            Examples: Conductivity, Magical Affinity, Crafting Difficulty, etc.
          </p>
        </div>
      )}
    </div>
  );
}
