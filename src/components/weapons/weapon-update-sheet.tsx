"use client";

import { IWeapon, updateWeapon, WeaponFormData } from "@/actions/weapons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader, Trash, Plus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { WeaponType, WeaponCategory, GraspType } from "@/types/weapon";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

// Form validation schema
const weaponUpdateSchema = z.object({
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
  grasp: z
    .array(z.nativeEnum(GraspType))
    .min(1, "At least one grip type is required"),
  properties: z.array(z.string()).optional(),
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

type UpdateWeaponSchema = z.infer<typeof weaponUpdateSchema>;

interface UpdateWeaponSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  weapon: IWeapon | null;
}

export function WeaponUpdateSheet({
  weapon,
  ...props
}: UpdateWeaponSheetProps) {
  const [isUpdatePending, startUpdateTransition] = React.useTransition();

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

  // Convert range Map to form data array
  const initialRangeData =
    weapon?.range && weapon.range.size > 0
      ? Array.from(weapon.range.entries()).map(([precision, distance]) => ({
          precision,
          distance,
        }))
      : [{ precision: 100, distance: 0 }];

  const form = useForm<UpdateWeaponSchema>({
    resolver: zodResolver(weaponUpdateSchema),
    defaultValues: {
      name: weapon?.name ?? "",
      description: weapon?.description ?? "",
      type: weapon?.type ?? WeaponType.MELEE,
      category: weapon?.category ?? WeaponCategory.SWORDS,
      baseDamageMin: weapon?.baseDamage?.[0] ?? 0,
      baseDamageMax: weapon?.baseDamage?.[1] ?? 0,
      weightMin: weapon?.weight?.[0] ?? 0,
      weightMax: weapon?.weight?.[1] ?? 0,
      price: weapon?.price ?? 0,
      material: weapon?.material ?? "",
      durability: weapon?.durability ?? 100,
      grasp: weapon?.grasp ?? [],
      properties: weapon?.properties ?? [],
      imageUrl: weapon?.imageUrl ?? "",
      rangeData: initialRangeData,
    },
  });

  React.useEffect(() => {
    if (weapon) {
      const rangeData =
        weapon.range && weapon.range.size > 0
          ? Array.from(weapon.range.entries()).map(([precision, distance]) => ({
              precision,
              distance,
            }))
          : [{ precision: 100, distance: 0 }];

      form.reset({
        name: weapon.name,
        description: weapon.description,
        type: weapon.type,
        category: weapon.category,
        baseDamageMin: weapon.baseDamage[0],
        baseDamageMax: weapon.baseDamage[1],
        weightMin: weapon.weight[0],
        weightMax: weapon.weight[1],
        price: weapon.price,
        material: weapon.material,
        durability: weapon.durability,
        grasp: weapon.grasp,
        properties: weapon.properties,
        imageUrl: weapon.imageUrl ?? "",
        rangeData: rangeData,
      });
    }
  }, [weapon, form]);

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

  function onSubmit(data: UpdateWeaponSchema) {
    startUpdateTransition(async () => {
      if (!weapon) return;

      try {
        const formData: WeaponFormData = {
          ...data,
          description: data.description || "", // Ensure description is never undefined
          properties: data.properties || [], // Ensure properties is never undefined
          rangeData: data.rangeData || [],
        };

        await updateWeapon(weapon.id, formData);
        props.onOpenChange?.(false);
        toast.success("Weapon updated successfully");
      } catch (error) {
        console.error("Error updating weapon:", error);
        toast.error("Failed to update weapon");
      }
    });
  }

  return (
    <Sheet {...props}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="text-left mb-4">
          <SheetTitle>Update Weapon</SheetTitle>
          <SheetDescription>
            Update the weapon details and save your changes
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Longsword" {...field} />
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
                        placeholder="A versatile weapon..."
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
                          <SelectTrigger className="capitalize">
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {Object.values(WeaponType).map((type) => (
                              <SelectItem
                                key={type}
                                value={type}
                                className="capitalize"
                              >
                                {type}
                              </SelectItem>
                            ))}
                          </SelectGroup>
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
                          <SelectTrigger className="capitalize">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
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
                          </SelectGroup>
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
                        <Input placeholder="Steel" {...field} />
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
                <Separator />
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

            <SheetFooter className="gap-2 pt-6 sm:space-x-0">
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
