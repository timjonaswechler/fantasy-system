// src/components/materials/tabs/states-tab.tsx
"use client";

import React from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash } from "lucide-react";
import { MaterialState } from "@/types/material";

interface StatesTabProps {
  form: UseFormReturn<any>;
  isReadOnly?: boolean;
}

export function StatesTab({ form, isReadOnly = false }: StatesTabProps) {
  const {
    fields: stateFields,
    append: appendState,
    remove: removeState,
  } = useFieldArray({
    control: form.control,
    name: "states",
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Material States</h3>
        {!isReadOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendState({
                state: MaterialState.LIQUID,
                description: "",
                color: "",
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add State
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {stateFields.map((field, index) => (
          <div key={field.id} className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-2">
              <FormField
                control={form.control}
                name={`states.${index}.state`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>State</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isReadOnly}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(MaterialState).map((state) => (
                          <SelectItem
                            key={state}
                            value={state}
                            className="capitalize"
                          >
                            {state.toLowerCase()}
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
                  onClick={() => removeState(index)}
                  className="ml-2"
                  disabled={stateFields.length <= 1}
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormField
                control={form.control}
                name={`states.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description of this state"
                        className="resize-none"
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
                name={`states.${index}.color`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Color in this state"
                        {...field}
                        disabled={isReadOnly}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
