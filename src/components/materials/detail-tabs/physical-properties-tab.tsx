// src/components/materials/tabs/physical-properties-tab.tsx
import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PhysicalPropertiesTabProps {
  form: UseFormReturn<any>;
  isReadOnly?: boolean;
}

export function PhysicalPropertiesTab({
  form,
  isReadOnly = false,
}: PhysicalPropertiesTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="density"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Density (kg/m³)</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          {...field}
                          readOnly={isReadOnly}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Typical values:</p>
                    <ul className="text-xs mt-1">
                      <li>Water: 1000 kg/m³</li>
                      <li>Iron: 7870 kg/m³</li>
                      <li>Gold: 19300 kg/m³</li>
                      <li>Wood: 400-900 kg/m³</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="durability"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durability (0-100)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="100"
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
          name="hardness"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hardness (0-100)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="100"
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
          name="sharpness"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sharpness (0-100)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  {...field}
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Temperature Properties</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="meltingPoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Melting Point (°C)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
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
            name="boilingPoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Boiling Point (°C)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
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
            name="ignitePoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ignite Point (°C)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Mechanical Properties</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="impactYield"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impact Yield</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
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
            name="impactFracture"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impact Fracture</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
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
            name="shearYield"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shear Yield</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
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
            name="shearFracture"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shear Fracture</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    readOnly={isReadOnly}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
