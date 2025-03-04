// src/components/materials/material-update-sheet.tsx
"use client";

import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Loader } from "lucide-react";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { IMaterial, MaterialCategory, MaterialState } from "@/types/material";
import { updateMaterial } from "@/actions/materials";

import {
  getSourceTransformationsForMaterial,
  getTargetTransformationsForMaterial,
} from "@/actions/material-transformations";

// Import tab components
import { BasicTab } from "./update-tabs/basic-tab";
import { PhysicalTab } from "./update-tabs/physical-tab";
import { PropertiesTab } from "./update-tabs/properties-tab";
import { StatesTab } from "./update-tabs/states-tab";
import { CompositeTab } from "./update-tabs/composite-tab";

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
  const [sourceTransformations, setSourceTransformations] = useState<any[]>([]);
  const [targetTransformations, setTargetTransformations] = useState<any[]>([]);
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
          ? (material as any).components.map((component: any) => ({
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
              <TabsContent value="basic">
                <BasicTab form={form} />
              </TabsContent>

              {/* Physical Tab */}
              <TabsContent value="physical">
                <PhysicalTab form={form} />
              </TabsContent>

              {/* Custom Properties Tab */}
              <TabsContent value="properties">
                <PropertiesTab form={form} />
              </TabsContent>

              {/* Material States Tab */}
              <TabsContent value="states">
                <StatesTab form={form} />
              </TabsContent>

              {/* Composite Materials Tab (only shown for composite materials) */}
              {showCompositeTab && (
                <TabsContent value="composite">
                  <CompositeTab
                    form={form}
                    availableMaterials={availableMaterials}
                  />
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
