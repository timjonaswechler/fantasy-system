// src/components/materials/material-update-sheet.tsx
"use client";

import React, { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { IMaterial, MaterialCategory, MaterialState } from "@/types/material";
import { updateMaterial } from "@/actions/materials";

import {
  getSourceTransformationsForMaterial,
  getTargetTransformationsForMaterial,
} from "@/actions/material-transformations";
import { MaterialTransformationPanel } from "./material-transformation-panel";
import { CompositeMaterial } from "@/types/material-composite";

// Form validation schema
const materialUpdateSchema = z.object({
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

  // Composite-specific fields (will be validated conditionally)
  compositeComponents: z
    .array(
      z.object({
        materialId: z.string(),
        percentage: z.number().min(0.1).max(100),
        isPrimary: z.boolean().default(false),
        propertyInfluence: z.record(z.string(), z.number()).optional(),
      })
    )
    .optional(),
});

type UpdateMaterialSchema = z.infer<typeof materialUpdateSchema>;

interface MaterialUpdateSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  material: IMaterial | null;
  availableMaterials?: IMaterial[]; // For composite editing
  onSuccess?: () => void;
}

export function MaterialUpdateSheet({
  material,
  availableMaterials = [],
  onSuccess,
  ...props
}: MaterialUpdateSheetProps) {
  const [isUpdatePending, startUpdateTransition] = React.useTransition();
  const [activeTab, setActiveTab] = useState("basic");

  // States for transformations
  const [sourceTransformations, setSourceTransformations] = useState([]);
  const [targetTransformations, setTargetTransformations] = useState([]);
  const [isLoadingTransformations, setIsLoadingTransformations] =
    useState(false);

  // Initialize form
  const form = useForm<UpdateMaterialSchema>({
    resolver: zodResolver(materialUpdateSchema),
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
      compositeComponents: [],
    },
  });

  // Setup field arrays for properties and states
  const {
    fields: propertyFields,
    append: appendProperty,
    remove: removeProperty,
    replace: replaceProperties,
  } = useFieldArray({
    control: form.control,
    name: "properties",
  });

  const {
    fields: stateFields,
    append: appendState,
    remove: removeState,
    replace: replaceStates,
  } = useFieldArray({
    control: form.control,
    name: "states",
  });

  // Setup field array for composite components if applicable
  const {
    fields: compositeComponentFields,
    append: appendCompositeComponent,
    remove: removeCompositeComponent,
    replace: replaceCompositeComponents,
  } = useFieldArray({
    control: form.control,
    name: "compositeComponents",
  });

  // Load transformations when material changes
  useEffect(() => {
    const loadTransformations = async () => {
      if (!material) return;

      setIsLoadingTransformations(true);
      try {
        const sourceResult = await getSourceTransformationsForMaterial(
          material.id
        );
        setSourceTransformations(sourceResult);

        const targetResult = await getTargetTransformationsForMaterial(
          material.id
        );
        setTargetTransformations(targetResult);
      } catch (error) {
        console.error("Error loading transformations:", error);
      } finally {
        setIsLoadingTransformations(false);
      }
    };

    loadTransformations();
  }, [material]);

  // Update form values when material changes
  useEffect(() => {
    if (material) {
      // Convert properties Map to array for form
      const propertiesArray = Array.from(material.properties.entries()).map(
        ([name, value]) => ({
          name,
          value,
        })
      );

      // Convert states Map to array for form
      const statesArray = Array.from(material.states.entries()).map(
        ([state, data]) => ({
          state,
          description: data.description || "",
          color: data.color || "",
        })
      );

      // Prepare composite components if applicable
      const componentsArray =
        material.isComposite && "components" in material
          ? (material as CompositeMaterial).components.map((component) => ({
              materialId:
                typeof component.material === "string"
                  ? component.material
                  : component.material.id,
              percentage: component.percentage,
              isPrimary: component.isPrimary,
              propertyInfluence: component.propertyInfluence || {},
            }))
          : [];

      // Set all form values
      form.reset({
        name: material.name,
        description: material.description,
        category: material.category,
        density: material.density,
        meltingPoint: material.meltingPoint,
        boilingPoint: material.boilingPoint,
        ignitePoint: material.ignitePoint,
        impactYield: material.impactYield,
        impactFracture: material.impactFracture,
        shearYield: material.shearYield,
        shearFracture: material.shearFracture,
        hardness: material.hardness,
        sharpness: material.sharpness,
        durability: material.durability,
        color: material.color,
        colorHex: material.colorHex,
        isMagical: material.isMagical,
        isRare: material.isRare,
        valueModifier: material.valueModifier,
        sourceLocation: material.sourceLocation,
        sourceCreature: material.sourceCreature,
        sourcePlant: material.sourcePlant,
        properties: propertiesArray,
        states:
          statesArray.length > 0
            ? statesArray
            : [
                {
                  state: MaterialState.SOLID,
                  description: "",
                  color: "",
                },
              ],
        compositeComponents: componentsArray,
      });

      // Update field arrays
      replaceProperties(propertiesArray);
      replaceStates(
        statesArray.length > 0
          ? statesArray
          : [
              {
                state: MaterialState.SOLID,
                description: "",
                color: "",
              },
            ]
      );

      // Update composite components if applicable
      if (material.isComposite) {
        replaceCompositeComponents(componentsArray);
      }
    }
  }, [
    material,
    form,
    replaceProperties,
    replaceStates,
    replaceCompositeComponents,
  ]);

  function onSubmit(data: UpdateMaterialSchema) {
    startUpdateTransition(async () => {
      if (!material) return;

      try {
        // Ensure required fields are defined as expected by MaterialFormData type
        const formattedData = {
          ...data,
          description: data.description || "", // Ensure description is always a string
          sourceLocation: data.sourceLocation || "",
          sourceCreature: data.sourceCreature || "",
          sourcePlant: data.sourcePlant || "",
          colorHex: data.colorHex || "#888888",
        };

        const result = await updateMaterial(material.id, formattedData);
        if (result.success) {
          props.onOpenChange?.(false);
          toast.success("Material updated successfully");
          onSuccess?.();
        }
      } catch (error) {
        console.error("Error updating material:", error);
        toast.error("Failed to update material");
      }
    });
  }

  if (!material) return null;

  // Determine if it's a composite material
  const isCompositeMaterial = material.isComposite;

  // Extra tab for composite materials
  const showCompositeTab = isCompositeMaterial && availableMaterials.length > 0;

  return (
    <Sheet {...props}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="text-left mb-4">
          <SheetTitle>Update Material</SheetTitle>
          <SheetDescription>
            Update the material details and save your changes
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <Tabs
              defaultValue="basic"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className={`mb-4`}>
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="physical">Physical</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="states">States</TabsTrigger>
                {showCompositeTab && (
                  <TabsTrigger value="composite">Composite</TabsTrigger>
                )}
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
                        value={field.value}
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
                                value={field.value}
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

              {/* Composite Materials Tab (only shown for composite materials) */}
              {showCompositeTab && (
                <TabsContent value="composite" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      Composite Components
                    </h3>
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
                      No components added. This doesn't appear to be a composite
                      material.
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
                                          compositeComponentFields.forEach(
                                            (_, i) => {
                                              if (i !== index) {
                                                form.setValue(
                                                  `compositeComponents.${i}.isPrimary`,
                                                  false
                                                );
                                              }
                                            }
                                          );
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
                                          backgroundColor:
                                            material.colorHex || "#888888",
                                        }}
                                      />
                                      <span>
                                        {material.category} | Hardness:{" "}
                                        {material.hardness || "N/A"} |
                                        Durability:{" "}
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
                              (sum, comp) => sum + (comp.percentage || 0),
                              0
                            ) || 0
                        ).toFixed(1)}
                        %
                      </Badge>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>

            <SheetFooter className="gap-2 pt-6">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button disabled={isUpdatePending}>
                {isUpdatePending && (
                  <Loader
                    className="mr-2 size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Save Changes
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
