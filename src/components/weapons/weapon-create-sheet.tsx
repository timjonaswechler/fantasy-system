"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Loader, Plus, Trash } from "lucide-react";

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

import { WeaponType, WeaponCategory, GraspType } from "@/types/weapon";
import { createWeapon } from "@/actions/weapons";

// Form validation schema
const weaponFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters long",
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
    message: "Material is required",
  }),
  durability: z.coerce.number().min(0).max(100),
  properties: z.array(z.string()).optional(),
  grasp: z.array(z.nativeEnum(GraspType)).min(1, {
    message: "At least one grip type is required",
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

interface CreateWeaponSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  onSuccess?: () => void;
}

export function WeaponCreateSheet({
  onSuccess,
  ...props
}: CreateWeaponSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available properties for selection
  const availableProperties = [
    "penetrating",
    "heavy",
    "fast",
    "precise",
    "long-range",
    "versatile",
    "bleeding",
    "magical",
    "dirty",
    "massive",
    "light",
    "balanced",
  ];

  // Initialize form with default values
  const form = useForm<WeaponFormValues>({
    resolver: zodResolver(weaponFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: WeaponType.MELEE,
      category: WeaponCategory.SWORDS,
      baseDamageMin: 0,
      baseDamageMax: 0,
      weightMin: 0,
      weightMax: 0,
      price: 0,
      material: "",
      durability: 100,
      properties: [],
      grasp: [GraspType.ONE_HANDED],
      imageUrl: "",
      rangeData: [{ precision: 100, distance: 0 }],
    },
  });

  // Form submission handler
  const onSubmit = async (values: WeaponFormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure description is always a string and properties is always an array
      const formData = {
        ...values,
        description: values.description || "",
        properties: values.properties || [],
      };

      const result = await createWeapon(formData);
      if (result.success) {
        toast.success("Weapon created successfully");
        form.reset(); // Reset form
        props.onOpenChange?.(false); // Close drawer
        onSuccess?.(); // Call success callback
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error saving weapon");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a new range data pair
  const addRangeData = () => {
    const currentRangeData = form.getValues("rangeData") || [];
    form.setValue("rangeData", [
      ...currentRangeData,
      { precision: 0, distance: 10 },
    ]);
  };

  // Remove a range data pair
  const removeRangeData = (index: number) => {
    const currentRangeData = form.getValues("rangeData") || [];
    if (currentRangeData.length <= 1) return; // Keep at least one entry

    form.setValue(
      "rangeData",
      currentRangeData.filter((_, i) => i !== index)
    );
  };

  // Handle weapon type change
  const handleTypeChange = (value: string) => {
    const newType = value as WeaponType;
    form.setValue("type", newType);

    // If set to RANGED/THROWING, ensure range data exists
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

    // Adjust category if needed
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
    <Sheet {...props}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Weapon</SheetTitle>
          <SheetDescription>
            Add a new weapon to your inventory
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
                      <Input placeholder="Weapon name" {...field} />
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
                        placeholder="Weapon description"
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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={(value) => handleTypeChange(value)}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose weapon type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={WeaponType.MELEE}>
                            Melee
                          </SelectItem>
                          <SelectItem value={WeaponType.RANGED}>
                            Ranged
                          </SelectItem>
                          <SelectItem value={WeaponType.THROWING}>
                            Throwing
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
                          {/* Melee weapon categories */}
                          {form.watch("type") === WeaponType.MELEE && (
                            <>
                              <SelectItem value={WeaponCategory.SWORDS}>
                                Swords
                              </SelectItem>
                              <SelectItem value={WeaponCategory.DAGGERS}>
                                Daggers
                              </SelectItem>
                              <SelectItem value={WeaponCategory.AXES}>
                                Axes
                              </SelectItem>
                              <SelectItem value={WeaponCategory.MACES}>
                                Maces
                              </SelectItem>
                              <SelectItem value={WeaponCategory.HAMMERS}>
                                Hammers
                              </SelectItem>
                              <SelectItem value={WeaponCategory.FLAILS}>
                                Flails
                              </SelectItem>
                              <SelectItem value={WeaponCategory.SPEARS}>
                                Spears
                              </SelectItem>
                              <SelectItem value={WeaponCategory.POLEARMS}>
                                Polearms
                              </SelectItem>
                              <SelectItem value={WeaponCategory.CLEAVERS}>
                                Cleavers
                              </SelectItem>
                            </>
                          )}

                          {/* Ranged weapon categories */}
                          {form.watch("type") === WeaponType.RANGED && (
                            <>
                              <SelectItem value={WeaponCategory.BOWS}>
                                Bows
                              </SelectItem>
                              <SelectItem value={WeaponCategory.CROSSBOWS}>
                                Crossbows
                              </SelectItem>
                              <SelectItem value={WeaponCategory.FIREARMS}>
                                Firearms
                              </SelectItem>
                            </>
                          )}

                          {/* Throwing weapon categories */}
                          {form.watch("type") === WeaponType.THROWING && (
                            <>
                              <SelectItem
                                value={WeaponCategory.THROWING_WEAPONS}
                              >
                                Throwing Weapons
                              </SelectItem>
                              <SelectItem
                                value={WeaponCategory.THROWABLE_ITEMS}
                              >
                                Throwable Items
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FormLabel className="block mb-2">Damage (Min-Max)</FormLabel>
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
                      name="baseDamageMax"
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
                  <FormLabel className="block mb-2">
                    Weight in kg (Min-Max)
                  </FormLabel>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (Gold)</FormLabel>
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
                        <Input placeholder="e.g. Steel, Wood" {...field} />
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
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add a URL to an image of the weapon
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Grip Type</FormLabel>
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
                                // At least one option must be selected
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
                          One-Handed
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
                                // At least one option must be selected
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
                          Two-Handed
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
                <FormLabel>Properties</FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
            </div>

            {/* Range data section */}
            {form.watch("type") !== WeaponType.MELEE && (
              <>
                <Separator className="my-2" />
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Range Data</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Precision at different distances
                    </p>
                  </div>

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
                                  placeholder="Precision %"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <span>% at</span>
                        <FormField
                          control={form.control}
                          name={`rangeData.${index}.distance`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="Distance (m)"
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
                      Add another data point
                    </Button>
                  </div>
                </div>
              </>
            )}

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
                  "Create Weapon"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
