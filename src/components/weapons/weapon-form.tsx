"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ArrowLeft,
  ChevronLeft,
  Trash,
  Plus,
  BarChart2,
  Target,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { IWeapon, WeaponType, WeaponCategory, GraspType } from "@/types/weapon";
import { createWeapon, updateWeapon } from "@/actions/weapons";

// Schema für die Formularvalidierung
const weaponFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name muss mindestens 2 Zeichen lang sein",
  }),
  description: z.string().optional(),
  type: z.nativeEnum(WeaponType),
  category: z.nativeEnum(WeaponCategory),
  baseDamageMin: z.coerce.number().min(0),
  baseDamageMax: z.coerce.number().min(0),
  weightMin: z.coerce.number().min(0),
  weightMax: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  material: z.string().min(1, {
    message: "Material ist erforderlich",
  }),
  durability: z.coerce.number().min(0).max(100),
  properties: z.array(z.string()).optional(),
  grasp: z.array(z.nativeEnum(GraspType)).min(1, {
    message: "Mindestens eine Griffart ist erforderlich",
  }),
  imageUrl: z.string().url().optional().or(z.literal("")),
  rangeData: z
    .array(
      z.object({
        precision: z.coerce.number().min(0).max(100),
        distance: z.coerce.number().min(0),
      })
    )
    .optional(),
});

type WeaponFormValues = z.infer<typeof weaponFormSchema>;

interface WeaponFormProps {
  initialData?: IWeapon;
  mode: "create" | "edit";
}

export const WeaponForm: React.FC<WeaponFormProps> = ({
  initialData,
  mode,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Konvertiere die Range-Map in das Format für das Formular
  const initialRangeData =
    initialData?.range && initialData.range.size > 0
      ? Array.from(initialData.range.entries()).map(
          ([precision, distance]) => ({
            precision,
            distance,
          })
        )
      : [{ precision: 100, distance: 0 }];

  // Initialisierung des Formulars mit Standardwerten
  const form = useForm<WeaponFormValues>({
    resolver: zodResolver(weaponFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      type: initialData?.type || WeaponType.MELEE,
      category: initialData?.category || WeaponCategory.SWORDS,
      baseDamageMin: initialData?.baseDamage?.[0] || 0,
      baseDamageMax: initialData?.baseDamage?.[1] || 0,
      weightMin: initialData?.weight?.[0] || 0,
      weightMax: initialData?.weight?.[1] || 0,
      price: initialData?.price || 0,
      material: initialData?.material || "",
      durability: initialData?.durability || 100,
      properties: initialData?.properties || [],
      grasp: initialData?.grasp || [GraspType.ONE_HANDED],
      imageUrl: initialData?.imageUrl || "",
      rangeData: initialRangeData,
    },
  });

  // Liste der verfügbaren Eigenschaften (z.B. für Checkbox-Auswahl)
  const availableProperties = [
    "durchdringend",
    "wuchtig",
    "schnell",
    "präzise",
    "langreichweitend",
    "vielseitig",
    "blutend",
    "magisch",
    "schmutzig",
    "massiv",
    "leicht",
    "balanciert",
  ];

  // Formular-Submission-Handler
  const onSubmit = async (values: WeaponFormValues) => {
    setIsSubmitting(true);
    try {
      // Sicherstellen, dass description immer ein String ist und properties immer ein Array ist
      const formData = {
        ...values,
        description: values.description || "",
        properties: values.properties || [],
      };

      // Je nach Modus den entsprechenden Server Action aufrufen
      if (mode === "create") {
        const result = await createWeapon(formData);
        if (result.success) {
          toast.success("Waffe erfolgreich erstellt");
          router.push(`/weapons/${result.id}`);
        }
      } else if (mode === "edit" && initialData) {
        const result = await updateWeapon(initialData.id, formData);
        if (result.success) {
          toast.success("Waffe erfolgreich aktualisiert");
          router.push(`/weapons/${initialData.id}`);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Fehler beim Speichern der Waffe");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fügt ein neues Range-Datenpaar hinzu
  const addRangeData = () => {
    const currentRangeData = form.getValues("rangeData") || [];
    form.setValue("rangeData", [
      ...currentRangeData,
      { precision: 0, distance: 10 },
    ]);
  };

  // Entfernt ein Range-Datenpaar
  const removeRangeData = (index: number) => {
    const currentRangeData = form.getValues("rangeData") || [];
    if (currentRangeData.length <= 1) return; // Mindestens ein Eintrag soll bleiben

    form.setValue(
      "rangeData",
      currentRangeData.filter((_, i) => i !== index)
    );
  };

  // Reaktion auf Änderung des Waffentyps
  const handleTypeChange = (value: string) => {
    const newType = value as WeaponType;
    form.setValue("type", newType);

    // Wenn auf RANGED/THROWING gesetzt, sicherstellen, dass Range-Daten vorhanden sind
    if (
      (newType === WeaponType.RANGED || newType === WeaponType.THROWING) &&
      (!form.getValues("rangeData") ||
        form.getValues("rangeData")?.length === 0)
    ) {
      form.setValue("rangeData", [
        { precision: 100, distance: 0 },
        { precision: 80, distance: 20 },
        { precision: 50, distance: 50 },
      ]);
    }

    // Kategorie ggf. anpassen
    if (newType === WeaponType.MELEE) {
      const currentCategory = form.getValues("category");
      if (
        currentCategory === WeaponCategory.BOWS ||
        currentCategory === WeaponCategory.CROSSBOWS ||
        currentCategory === WeaponCategory.FIREARMS ||
        currentCategory === WeaponCategory.THROWING_WEAPONS ||
        currentCategory === WeaponCategory.THROWABLE_ITEMS
      ) {
        form.setValue("category", WeaponCategory.SWORDS);
      }
    } else if (newType === WeaponType.RANGED) {
      const currentCategory = form.getValues("category");
      if (
        currentCategory !== WeaponCategory.BOWS &&
        currentCategory !== WeaponCategory.CROSSBOWS &&
        currentCategory !== WeaponCategory.FIREARMS
      ) {
        form.setValue("category", WeaponCategory.BOWS);
      }
    } else if (newType === WeaponType.THROWING) {
      form.setValue("category", WeaponCategory.THROWING_WEAPONS);
    }
  };

  return (
    <div className="container mx-auto pb-8">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>
        <h1 className="text-3xl font-bold">
          {mode === "create" ? "Neue Waffe erstellen" : "Waffe bearbeiten"}
        </h1>
        <div className="w-[100px]"></div>{" "}
        {/* Spacer für symmetrisches Layout */}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hauptinformationen */}
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Allgemeine Informationen</CardTitle>
                <CardDescription>
                  Grundlegende Daten der Waffe eingeben
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name der Waffe" {...field} />
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
                          placeholder="Beschreibung der Waffe"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Typ</FormLabel>
                        <Select
                          onValueChange={(value) => handleTypeChange(value)}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Waffentyp wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={WeaponType.MELEE}>
                              Nahkampf
                            </SelectItem>
                            <SelectItem value={WeaponType.RANGED}>
                              Fernkampf
                            </SelectItem>
                            <SelectItem value={WeaponType.THROWING}>
                              Wurfwaffe
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategorie</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kategorie wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Nahkampfwaffen-Kategorien */}
                            {form.watch("type") === WeaponType.MELEE && (
                              <>
                                <SelectItem value={WeaponCategory.SWORDS}>
                                  Schwerter
                                </SelectItem>
                                <SelectItem value={WeaponCategory.DAGGERS}>
                                  Dolche
                                </SelectItem>
                                <SelectItem value={WeaponCategory.AXES}>
                                  Äxte
                                </SelectItem>
                                <SelectItem value={WeaponCategory.MACES}>
                                  Keulen
                                </SelectItem>
                                <SelectItem value={WeaponCategory.HAMMERS}>
                                  Hämmer
                                </SelectItem>
                                <SelectItem value={WeaponCategory.FLAILS}>
                                  Flegel
                                </SelectItem>
                                <SelectItem value={WeaponCategory.SPEARS}>
                                  Speere
                                </SelectItem>
                                <SelectItem value={WeaponCategory.POLEARMS}>
                                  Stangenwaffen
                                </SelectItem>
                                <SelectItem value={WeaponCategory.CLEAVERS}>
                                  Hiebwaffen
                                </SelectItem>
                              </>
                            )}

                            {/* Fernkampfwaffen-Kategorien */}
                            {form.watch("type") === WeaponType.RANGED && (
                              <>
                                <SelectItem value={WeaponCategory.BOWS}>
                                  Bögen
                                </SelectItem>
                                <SelectItem value={WeaponCategory.CROSSBOWS}>
                                  Armbrüste
                                </SelectItem>
                                <SelectItem value={WeaponCategory.FIREARMS}>
                                  Feuerwaffen
                                </SelectItem>
                              </>
                            )}

                            {/* Wurfwaffen-Kategorien */}
                            {form.watch("type") === WeaponType.THROWING && (
                              <>
                                <SelectItem
                                  value={WeaponCategory.THROWING_WEAPONS}
                                >
                                  Wurfwaffen
                                </SelectItem>
                                <SelectItem
                                  value={WeaponCategory.THROWABLE_ITEMS}
                                >
                                  Wurfgegenstände
                                </SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Schaden (Min-Max)
                    </h3>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="baseDamageMin"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Max"
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
                    <h3 className="text-sm font-medium mb-2">
                      Gewicht in kg (Min-Max)
                    </h3>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="weightMin"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                placeholder="Min"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="weightMax"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                placeholder="Max"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preis (Gold)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Stahl, Holz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="durability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Haltbarkeit (0-100)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bild-URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://beispiel.com/bild.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Füge eine URL zu einem Bild der Waffe ein
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Griffart</FormLabel>
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="grasp"
                      render={() => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={form
                                .watch("grasp")
                                .includes(GraspType.ONE_HANDED)}
                              onCheckedChange={(checked) => {
                                const current = form.getValues("grasp");
                                if (checked) {
                                  if (!current.includes(GraspType.ONE_HANDED)) {
                                    form.setValue("grasp", [
                                      ...current,
                                      GraspType.ONE_HANDED,
                                    ]);
                                  }
                                } else {
                                  // Mindestens eine Option muss ausgewählt sein
                                  if (current.length > 1) {
                                    form.setValue(
                                      "grasp",
                                      current.filter(
                                        (g) => g !== GraspType.ONE_HANDED
                                      )
                                    );
                                  }
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">
                            Einhändig
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="grasp"
                      render={() => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={form
                                .watch("grasp")
                                .includes(GraspType.TWO_HANDED)}
                              onCheckedChange={(checked) => {
                                const current = form.getValues("grasp");
                                if (checked) {
                                  if (!current.includes(GraspType.TWO_HANDED)) {
                                    form.setValue("grasp", [
                                      ...current,
                                      GraspType.TWO_HANDED,
                                    ]);
                                  }
                                } else {
                                  // Mindestens eine Option muss ausgewählt sein
                                  if (current.length > 1) {
                                    form.setValue(
                                      "grasp",
                                      current.filter(
                                        (g) => g !== GraspType.TWO_HANDED
                                      )
                                    );
                                  }
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">
                            Zweihändig
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormMessage>
                    {form.formState.errors.grasp?.message}
                  </FormMessage>
                </div>

                <div className="space-y-2">
                  <FormLabel>Eigenschaften</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {availableProperties.map((property) => (
                      <FormField
                        key={property}
                        control={form.control}
                        name="properties"
                        render={() => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={(
                                  form.watch("properties") || []
                                ).includes(property)}
                                onCheckedChange={(checked) => {
                                  const current =
                                    form.getValues("properties") || [];
                                  if (checked) {
                                    form.setValue("properties", [
                                      ...current,
                                      property,
                                    ]);
                                  } else {
                                    form.setValue(
                                      "properties",
                                      current.filter((p) => p !== property)
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer capitalize">
                              {property}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reichweitendaten-Karte (nur für Fernkampf- und Wurfwaffen) */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Reichweitendaten
                </CardTitle>
                <CardDescription>
                  {form.watch("type") === WeaponType.MELEE
                    ? "Nahkampfwaffen haben keine Reichweitendaten."
                    : "Präzision bei verschiedenen Distanzen"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.watch("type") !== WeaponType.MELEE ? (
                  <div className="space-y-2">
                    {form.watch("rangeData")?.map((_, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <FormField
                          control={form.control}
                          name={`rangeData.${index}.precision`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="Präzision %"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span>% bei</span>
                        <FormField
                          control={form.control}
                          name={`rangeData.${index}.distance`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="Distanz (m)"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span>m</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRangeData(index)}
                          disabled={(form.watch("rangeData") || []).length <= 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRangeData}
                      className="mt-2 w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Weiteren Datenpunkt hinzufügen
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 bg-muted rounded-md">
                    <p className="text-muted-foreground">
                      Reichweitendaten nicht verfügbar für Nahkampfwaffen
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Wird gespeichert..."
                : mode === "create"
                ? "Waffe erstellen"
                : "Waffe aktualisieren"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
