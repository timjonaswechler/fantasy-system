"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Loader, Plus, Trash, Info, X } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { MaterialCategory, MaterialState } from "@/types/material";
import { createMaterial } from "@/actions/materials";

// Form validation schema
const materialFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters long",
  }),
  description: z.string().optional(),
  category: z.nativeEnum(MaterialCategory),

  // Physical properties
  density: z.coerce.number().optional(),
  meltingPoint: z.coerce.number().optional(),
  boilingPoint: z.coerce.number().optional(),
  ignitePoint: z.coerce.number().optional(),

  // Mechanical properties
  impactYield: z.coerce.number().optional(),
  impactFracture: z.coerce.number().optional(),
  shearYield: z.coerce.number().optional(),
  shearFracture: z.coerce.number().optional(),

  // Combat properties
  hardness: z.coerce.number().min(0).max(100).optional(),
  sharpness: z.coerce.number().min(0).max(100).optional(),
  durability: z.coerce.number().min(0).max(100).optional(),

  // Appearance
  color: z.string().min(1, { message: "Color is required" }),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: "Color must be a valid hex color (e.g. #FF0000)",
    })
    .optional(),

  // Special properties
  isMagical: z.boolean().default(false),
  isRare: z.boolean().default(false),
  valueModifier: z.coerce.number().min(0).default(1),

  // Source
  sourceLocation: z.string().optional(),
  sourceCreature: z.string().optional(),
  sourcePlant: z.string().optional(),

  // Additional properties
  properties: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Property name is required" }),
        value: z.string().min(1, { message: "Property value is required" }),
      })
    )
    .optional(),

  // States
  states: z
    .array(
      z.object({
        state: z.nativeEnum(MaterialState),
        description: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .optional(),
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

interface MaterialCreateSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  onSuccess?: () => void;
}

export function MaterialCreateSheet({
  onSuccess,
  ...props
}: MaterialCreateSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: MaterialCategory.METAL,
      density: undefined,
      meltingPoint: undefined,
      boilingPoint: undefined,
      ignitePoint: undefined,
      impactYield: undefined,
      impactFracture: undefined,
      shearYield: undefined,
      shearFracture: undefined,
      hardness: 50,
      sharpness: 0,
      durability: 50,
      color: "",
      colorHex: "#888888",
      isMagical: false,
      isRare: false,
      valueModifier: 1,
      sourceLocation: "",
      sourceCreature: "",
      sourcePlant: "",
      properties: [],
      states: [
        {
          state: MaterialState.SOLID,
          description: "",
          color: "",
        },
      ],
    },
  });

  // Setup field arrays for properties and states
  const {
    fields: propertyFields,
    append: appendProperty,
    remove: removeProperty,
  } = useFieldArray({
    control: form.control,
    name: "properties",
  });

  const {
    fields: stateFields,
    append: appendState,
    remove: removeState,
  } = useFieldArray({
    control: form.control,
    name: "states",
  });

  // Form submission handler
  const onSubmit = async (values: MaterialFormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure all optional string fields have default values
      const formattedValues = {
        ...values,
        description: values.description || "",
        colorHex: values.colorHex || "",
        sourceLocation: values.sourceLocation || "",
        sourceCreature: values.sourceCreature || "",
        sourcePlant: values.sourcePlant || "",
        states: values.states?.map((state) => ({
          ...state,
          description: state.description || "",
          color: state.color || "",
        })),
      };

      const result = await createMaterial(formattedValues);
      if (result.success) {
        toast.success("Material created successfully");
        form.reset(); // Reset form
        props.onOpenChange?.(false); // Close drawer
        onSuccess?.(); // Call success callback
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error saving material");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet {...props}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Material</SheetTitle>
          <SheetDescription>
            Add a new material to your inventory
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 mt-6"
          >
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="physical">Physical</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="states">States</TabsTrigger>
              </TabsList>

              {/* Basic Tab */}
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Material name" {...field} />
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
                          placeholder="Material description"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(MaterialCategory).map((category) => (
                            <SelectItem
                              key={category}
                              value={category}
                              className="capitalize"
                            >
                              {category.toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Silver, Red" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="colorHex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Hex</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="#RRGGBB" {...field} />
                          </FormControl>
                          <div
                            className="h-10 w-10 rounded-md border"
                            style={{
                              backgroundColor: field.value || "#888888",
                            }}
                          ></div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="valueModifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value Modifier</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.1" {...field} />
                        </FormControl>
                        <FormDescription>Base value multiplier</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isMagical"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Magical</FormLabel>
                          <FormDescription>
                            Has magical properties
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isRare"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Rare</FormLabel>
                          <FormDescription>
                            Hard to find material
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Source Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="sourceLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Source location" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sourceCreature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Creature</FormLabel>
                          <FormControl>
                            <Input placeholder="Source creature" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sourcePlant"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plant</FormLabel>
                          <FormControl>
                            <Input placeholder="Source plant" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Physical Tab */}
              <TabsContent value="physical" className="space-y-4">
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
                          <Input type="number" min="0" max="100" {...field} />
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
                          <Input type="number" min="0" max="100" {...field} />
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
                          <Input type="number" min="0" max="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Temperature Properties
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="meltingPoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Melting Point (°C)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
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
                            <Input type="number" {...field} />
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
                            <Input type="number" {...field} />
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
                            <Input type="number" min="0" {...field} />
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
                            <Input type="number" min="0" {...field} />
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
                            <Input type="number" min="0" {...field} />
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
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Custom Properties Tab */}
              <TabsContent value="properties" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Custom Properties</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendProperty({ name: "", value: "" })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Property
                  </Button>
                </div>

                {propertyFields.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No custom properties added yet. Click "Add Property" to
                    create one.
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
                                <Input placeholder="Property name" {...field} />
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
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-sm text-muted-foreground mt-4">
                  <p>
                    Custom properties allow you to add any additional data about
                    this material.
                  </p>
                  <p>
                    Examples: Conductivity, Magical Affinity, Crafting
                    Difficulty, etc.
                  </p>
                </div>
              </TabsContent>

              {/* Material States Tab */}
              <TabsContent value="states" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Material States</h3>
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
                                defaultValue={field.value}
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
              </TabsContent>
            </Tabs>

            <SheetFooter className="mt-6 border-t pt-6">
              <SheetClose asChild>
                <Button type="button" variant="outline">
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
                  "Create Material"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
