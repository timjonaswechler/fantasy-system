"use client";

import { IWeapon, updateWeapon, WeaponFormData } from "@/actions/weapons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
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

// Form validation schema
const updateWeaponSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(WeaponType),
  category: z.nativeEnum(WeaponCategory),
  baseDamageMin: z.coerce.number().min(0),
  baseDamageMax: z.coerce.number().min(0),
  weightMin: z.coerce.number().min(0),
  weightMax: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  material: z.string().min(1, "Material is required"),
  durability: z.coerce.number().min(1),
  grasp: z
    .array(z.nativeEnum(GraspType))
    .min(1, "At least one grasp type is required"),
  properties: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
});

type UpdateWeaponSchema = z.infer<typeof updateWeaponSchema>;

interface UpdateWeaponSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  weapon: IWeapon | null;
}

export function UpdateWeaponSheet({
  weapon,
  ...props
}: UpdateWeaponSheetProps) {
  const [isUpdatePending, startUpdateTransition] = React.useTransition();

  const form = useForm<UpdateWeaponSchema>({
    resolver: zodResolver(updateWeaponSchema),
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
      durability: weapon?.durability ?? 1,
      grasp: weapon?.grasp ?? [],
      properties: weapon?.properties ?? [],
      imageUrl: weapon?.imageUrl ?? "",
    },
  });

  React.useEffect(() => {
    if (weapon) {
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
      });
    }
  }, [weapon, form]);

  function onSubmit(data: UpdateWeaponSchema) {
    startUpdateTransition(async () => {
      if (!weapon) return;

      try {
        const formData: WeaponFormData = {
          ...data,
          description: data.description || "", // Ensure description is never undefined
          properties: data.properties || [], // Ensure properties is never undefined
          rangeData: weapon.range
            ? Array.from(weapon.range.entries()).map(
                ([precision, distance]) => ({
                  precision,
                  distance,
                })
              )
            : undefined,
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

  const graspOptions = Object.values(GraspType);

  return (
    <Sheet {...props}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Update Weapon</SheetTitle>
          <SheetDescription>
            Update the weapon details and save your changes
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 py-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
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
                  <FormItem className="col-span-2">
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

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
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
                          {Object.values(WeaponCategory).map((category) => (
                            <SelectItem
                              key={category}
                              value={category}
                              className="capitalize"
                            >
                              {category}
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
                name="baseDamageMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Damage</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baseDamageMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Damage</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weightMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weightMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (GP)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="15" {...field} />
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

              <FormField
                control={form.control}
                name="durability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durability</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grasp"
                render={() => (
                  <FormItem className="col-span-2">
                    <FormLabel>Grasp Type</FormLabel>
                    <div className="flex flex-col gap-2">
                      {graspOptions.map((option) => (
                        <FormField
                          key={option}
                          control={form.control}
                          name="grasp"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={option}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(option)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...field.value, option]
                                        : field.value?.filter(
                                            (val) => val !== option
                                          );
                                      field.onChange(updatedValue);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {option === GraspType.ONE_HANDED
                                    ? "One-Handed"
                                    : "Two-Handed"}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="gap-2 pt-2 sm:space-x-0">
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
                Save
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
