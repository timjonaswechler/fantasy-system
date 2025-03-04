// src/components/materials/material-detail-sheet.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash, Sparkles, Layers } from "lucide-react";
import { IMaterial, MaterialCategory, MaterialState } from "@/types/material";
import { TransformationResult } from "@/types/material-transformation";
import { Form } from "@/components/ui/form";

// Import our tab components
import { BasicInfoTab } from "./detail-tabs/basic-info-tab";
import { PhysicalPropertiesTab } from "./detail-tabs/physical-properties-tab";
import { CustomPropertiesTab } from "./detail-tabs/custom-properties-tab";
import { StatesTab } from "./detail-tabs/states-tab";
import { TransformationsTab } from "./detail-tabs/transformations-tab";
import { CompositionTab } from "./detail-tabs/composition-tab";

// The schema helps structure our form
const detailFormSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.nativeEnum(MaterialCategory),
  density: z.number().optional(),
  meltingPoint: z.number().optional(),
  boilingPoint: z.number().optional(),
  ignitePoint: z.number().optional(),
  impactYield: z.number().optional(),
  impactFracture: z.number().optional(),
  shearYield: z.number().optional(),
  shearFracture: z.number().optional(),
  hardness: z.number().optional(),
  sharpness: z.number().optional(),
  durability: z.number().optional(),
  color: z.string(),
  colorHex: z.string().optional(),
  isMagical: z.boolean().default(false),
  isRare: z.boolean().default(false),
  valueModifier: z.number().default(1),
  sourceLocation: z.string().optional(),
  sourceCreature: z.string().optional(),
  sourcePlant: z.string().optional(),
  properties: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      })
    )
    .optional(),
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

type DetailFormValues = z.infer<typeof detailFormSchema>;

interface MaterialDetailSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  material: IMaterial | null;
  availableMaterials?: IMaterial[]; // For context about other materials
  onEdit?: () => void;
  onDelete?: () => void;
  onTransform?: (result: TransformationResult) => void;
  onCreateTransformation?: () => void;
}

export function MaterialDetailSheet({
  material,
  availableMaterials = [],
  onEdit,
  onDelete,
  onTransform,
  onCreateTransformation,
  ...props
}: MaterialDetailSheetProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Using a form to easily display the material data in read-only mode
  const form = useForm<DetailFormValues>({
    resolver: zodResolver(detailFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: MaterialCategory.METAL,
      color: "",
      colorHex: "#888888",
      isMagical: false,
      isRare: false,
      valueModifier: 1,
      properties: [],
      states: [],
    },
  });

  // Update form values when material changes
  useEffect(() => {
    if (material) {
      // Convert properties Map to array for form - fix type errors
      const propertiesArray = Array.from(material.properties || new Map()).map(
        ([key, val]) => ({
          name: key,
          value: val,
        })
      );

      // Convert states Map to array for form - fix type errors
      const statesArray = Array.from(material.states || new Map()).map(
        ([state, data]) => ({
          state: state as MaterialState,
          description: data.description || "",
          color: data.color || "",
        })
      );

      // Reset form with material data
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
        colorHex: material.colorHex || "",
        isMagical: material.isMagical,
        isRare: material.isRare || false,
        valueModifier: material.valueModifier || 1,
        sourceLocation: material.sourceLocation || "",
        sourceCreature: material.sourceCreature || "",
        sourcePlant: material.sourcePlant || "",
        properties: propertiesArray,
        states: statesArray,
      });
    }
  }, [material, form]);

  if (!material) return null;

  // Check if it's a composite material
  const isCompositeMaterial = material.isComposite;

  // Build tabs list
  const tabsList = [
    { id: "overview", label: "Overview" },
    { id: "physical", label: "Physical" },
    { id: "properties", label: "Properties" },
    { id: "states", label: "States" },
    { id: "transformations", label: "Transformations" },
  ];

  // Add composition tab if it's a composite material
  if (isCompositeMaterial) {
    tabsList.push({ id: "composition", label: "Composition" });
  }

  return (
    <Sheet {...props}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex justify-between items-center">
            <div>
              <SheetTitle className="text-2xl">{material.name}</SheetTitle>
              <div className="flex items-center mt-1 flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="capitalize"
                  style={{
                    backgroundColor: material.colorHex || undefined,
                  }}
                >
                  {material.category.toLowerCase()}
                </Badge>
                {material.isMagical && (
                  <Badge variant="secondary">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Magical
                  </Badge>
                )}
                {material.isRare && (
                  <Badge
                    variant="outline"
                    className="text-amber-500 border-amber-500"
                  >
                    Rare
                  </Badge>
                )}
                {isCompositeMaterial && (
                  <Badge variant="default" className="bg-indigo-500">
                    <Layers className="mr-1 h-3 w-3" />
                    Composite
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <SheetDescription className="mt-2">
            {material.description}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form className="mt-6">
            <Tabs
              defaultValue="overview"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-5">
                {tabsList.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Overview Tab - Basic Information */}
              <TabsContent value="overview">
                <BasicInfoTab form={form} isReadOnly={true} />

                {/* Durability bar */}
                {material.durability !== undefined && (
                  <div className="w-full space-y-2 mt-4">
                    <h3 className="font-medium mb-1">Durability</h3>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          material.durability > 75
                            ? "bg-emerald-500"
                            : material.durability > 50
                            ? "bg-amber-500"
                            : material.durability > 25
                            ? "bg-orange-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${material.durability}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {material.durability}/100
                      {material.durability > 90
                        ? " (Exceptional)"
                        : material.durability > 75
                        ? " (Excellent)"
                        : material.durability > 50
                        ? " (Good)"
                        : material.durability > 25
                        ? " (Poor)"
                        : " (Very Poor)"}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Physical Properties Tab */}
              <TabsContent value="physical">
                <PhysicalPropertiesTab form={form} isReadOnly={true} />
              </TabsContent>

              {/* Custom Properties Tab */}
              <TabsContent value="properties">
                <CustomPropertiesTab form={form} isReadOnly={true} />
              </TabsContent>

              {/* Material States Tab */}
              <TabsContent value="states">
                <StatesTab form={form} isReadOnly={true} />
              </TabsContent>

              {/* Transformations Tab */}
              <TabsContent value="transformations">
                <TransformationsTab
                  material={material}
                  onTransform={onTransform}
                  onCreateTransformation={onCreateTransformation}
                  isReadOnly={true}
                />
              </TabsContent>

              {/* Composition Tab (only for composite materials) */}
              {isCompositeMaterial && (
                <TabsContent value="composition">
                  <CompositionTab material={material} isReadOnly={true} />
                </TabsContent>
              )}
            </Tabs>
          </form>
        </Form>

        <SheetFooter className="flex gap-2 pt-6 border-t mt-6">
          <Button onClick={onEdit} variant="outline">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button onClick={onDelete} variant="destructive">
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
          <SheetClose asChild>
            <Button variant="secondary">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
