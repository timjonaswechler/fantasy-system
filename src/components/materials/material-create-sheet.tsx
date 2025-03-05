// src/components/materials/material-create-sheet.tsx
"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Loader, Plus, Trash, Palette } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { MaterialCategory, MaterialFormData } from "@/types/material";
import { createMaterial } from "@/actions/materials";

// Formularvalidierungsschema
const materialFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name muss mindestens 2 Zeichen lang sein",
  }),
  description: z.string().optional(),
  category: z.nativeEnum(MaterialCategory),
  density: z.coerce.number().min(0),
  valueModifier: z.coerce.number().min(0),
  impactYield: z.coerce.number().min(0),
  impactFracture: z.coerce.number().min(0),
  impactStrainAtYield: z.coerce.number().min(0),
  shearYield: z.coerce.number().min(0),
  shearFracture: z.coerce.number().min(0),
  shearStrainAtYield: z.coerce.number().min(0),
  meltingPoint: z.coerce.number().optional(),
  boilingPoint: z.coerce.number().optional(),
  ignitePoint: z.coerce.number().optional(),
  specificHeat: z.coerce.number().optional(),
  displayColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Muss ein gültiger HEX-Farbcode sein (z.B. #FF0000)",
  }),
  isMetal: z.boolean().default(false),
  isStone: z.boolean().default(false),
  isGem: z.boolean().default(false),
  isOrganic: z.boolean().default(false),
  isFabric: z.boolean().default(false),
  additionalProperties: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

interface CreateMaterialSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  onSuccess?: () => void;
}

export function MaterialCreateSheet({
  onSuccess,
  ...props
}: CreateMaterialSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalProps, setAdditionalProps] = useState<
    Record<string, string>
  >({});
  const [newPropKey, setNewPropKey] = useState("");
  const [newPropValue, setNewPropValue] = useState("");

  // Formular initialisieren
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: MaterialCategory.METAL,
      density: 0,
      valueModifier: 1.0,
      impactYield: 0,
      impactFracture: 0,
      impactStrainAtYield: 0.001,
      shearYield: 0,
      shearFracture: 0,
      shearStrainAtYield: 0.001,
      meltingPoint: undefined,
      boilingPoint: undefined,
      ignitePoint: undefined,
      specificHeat: undefined,
      displayColor: "#CCCCCC",
      isMetal: false,
      isStone: false,
      isGem: false,
      isOrganic: false,
      isFabric: false,
    },
  });

  // Formular-Submission-Handler
  const onSubmit = async (values: MaterialFormValues) => {
    setIsSubmitting(true);
    try {
      // Zusätzliche Eigenschaften dem Formular hinzufügen
      const formData: MaterialFormData = {
        ...values,
        description: values.description || "",
        additionalProperties:
          Object.keys(additionalProps).length > 0 ? additionalProps : undefined,
      };

      const result = await createMaterial(formData);
      if (result.success) {
        toast.success("Material erfolgreich erstellt");
        form.reset(); // Formular zurücksetzen
        setAdditionalProps({});
        props.onOpenChange?.(false); // Sheet schließen
        onSuccess?.(); // Erfolgs-Callback aufrufen
      }
    } catch (error) {
      console.error("Fehler beim Speichern des Materials:", error);
      toast.error("Fehler beim Erstellen des Materials");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Zusätzliche Eigenschaft hinzufügen
  const addProperty = () => {
    if (newPropKey.trim() && newPropValue.trim()) {
      setAdditionalProps((prev) => ({
        ...prev,
        [newPropKey.trim()]: newPropValue.trim(),
      }));
      setNewPropKey("");
      setNewPropValue("");
    }
  };

  // Zusätzliche Eigenschaft entfernen
  const removeProperty = (key: string) => {
    const { [key]: _, ...rest } = additionalProps;
    setAdditionalProps(rest);
  };

  // Kategorie-Änderung behandeln
  const handleCategoryChange = (value: string) => {
    const category = value as MaterialCategory;
    form.setValue("category", category);

    // Flags automatisch anpassen
    switch (category) {
      case MaterialCategory.METAL:
        form.setValue("isMetal", true);
        form.setValue("isStone", false);
        form.setValue("isGem", false);
        form.setValue("isOrganic", false);
        form.setValue("isFabric", false);
        break;
      case MaterialCategory.STONE:
        form.setValue("isMetal", false);
        form.setValue("isStone", true);
        form.setValue("isGem", false);
        form.setValue("isOrganic", false);
        form.setValue("isFabric", false);
        break;
      case MaterialCategory.GEM:
        form.setValue("isMetal", false);
        form.setValue("isStone", false);
        form.setValue("isGem", true);
        form.setValue("isOrganic", false);
        form.setValue("isFabric", false);
        break;
      // Weitere Kategorien nach Bedarf...
    }
  };

  return (
    <Sheet {...props}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Neues Material erstellen</SheetTitle>
          <SheetDescription>
            Fügen Sie der Materialdatenbank ein neues Material hinzu
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 mt-6"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Materialname" {...field} />
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
                    <FormLabel>Beschreibung</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Materialbeschreibung"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategorie</FormLabel>
                      <Select
                        onValueChange={handleCategoryChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Materialkategorie wählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(MaterialCategory).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
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
                  name="displayColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anzeigefarbe</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input placeholder="#CCCCCC" {...field} />
                        </FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-8"
                              style={{ backgroundColor: field.value }}
                            >
                              <Palette className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64">
                            <div className="grid grid-cols-8 gap-1">
                              {[
                                "#CCCCCC",
                                "#000000",
                                "#FFFFFF",
                                "#FF0000",
                                "#00FF00",
                                "#0000FF",
                                "#FFFF00",
                                "#FF00FF",
                                "#00FFFF",
                                "#FFA500",
                                "#800080",
                                "#008000",
                                "#800000",
                                "#008080",
                                "#808000",
                                "#A52A2A",
                                "#C0C0C0",
                                "#808080",
                                "#FFD700",
                                "#B87333",
                                "#FF6347",
                                "#4682B4",
                                "#32CD32",
                                "#9370DB",
                                "#F4A460",
                                "#2F4F4F",
                                "#CD853F",
                                "#F5F5DC",
                                "#D3D3D3",
                                "#D2B48C",
                                "#E6E6FA",
                                "#F0F8FF",
                                "#E0FFFF",
                                "#FFFACD",
                                "#FFF0F5",
                                "#F0FFF0",
                              ].map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className="size-6 rounded-sm border border-gray-300"
                                  style={{ backgroundColor: color }}
                                  onClick={() =>
                                    form.setValue("displayColor", color)
                                  }
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="density"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dichte (kg/m³)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valueModifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wertmodifikator</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <h3 className="text-lg font-medium">Mechanische Eigenschaften</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-md font-medium mb-2">Druckfestigkeit</h4>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="impactYield"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Streckgrenze (N/mm²)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              {...field}
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
                          <FormLabel>Bruchfestigkeit (N/mm²)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="impactStrainAtYield"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dehnung bei Streckgrenze</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium mb-2">Scherfestigkeit</h4>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="shearYield"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Streckgrenze (N/mm²)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              {...field}
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
                          <FormLabel>Bruchfestigkeit (N/mm²)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shearStrainAtYield"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dehnung bei Streckgrenze</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <h3 className="text-lg font-medium">Thermische Eigenschaften</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="meltingPoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schmelzpunkt (°C)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value)
                            )
                          }
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
                      <FormLabel>Siedepunkt (°C)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specificHeat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Spezifische Wärmekapazität (J/(kg·K))
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value)
                            )
                          }
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
                      <FormLabel>Zündtemperatur (°C, falls brennbar)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <h3 className="text-lg font-medium">Materialeigenschaften</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="isMetal"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer">Metall</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isStone"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer">Stein</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isGem"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer">
                        Edelstein
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isOrganic"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer">
                        Organisch
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isFabric"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer">Stoff</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <h3 className="text-lg font-medium mb-2">
                Zusätzliche Eigenschaften
              </h3>

              <div className="space-y-4">
                {/* Bestehende zusätzliche Eigenschaften anzeigen */}
                {Object.entries(additionalProps).length > 0 && (
                  <div className="rounded-md border p-3">
                    <div className="space-y-2">
                      {Object.entries(additionalProps).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div className="text-sm font-medium">{key}:</div>
                            <div>{value}</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProperty(key)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formular zum Hinzufügen neuer Eigenschaften */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Eigenschaft"
                    value={newPropKey}
                    onChange={(e) => setNewPropKey(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Wert"
                    value={newPropValue}
                    onChange={(e) => setNewPropValue(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addProperty}
                    disabled={!newPropKey.trim() || !newPropValue.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <SheetFooter className="mt-6 border-t pt-6">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Abbrechen
                </Button>
              </SheetClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Wird erstellt...
                  </>
                ) : (
                  "Material erstellen"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
