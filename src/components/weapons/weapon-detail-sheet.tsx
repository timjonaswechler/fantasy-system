"use client";

import React from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Sword,
  Weight,
  DollarSign,
  Heart,
  Target,
  BarChart2,
  Edit,
  Trash,
} from "lucide-react";
import { IWeapon, WeaponType, WeaponCategory, GraspType } from "@/types/weapon";
import dynamic from "next/dynamic";

// Dynamic import for the range chart
const RangeChart = dynamic(
  () => import("@/components/weapons/weapon-detail/range-chart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 flex items-center justify-center bg-muted rounded-md">
        Loading range chart...
      </div>
    ),
  }
);

interface WeaponDetailSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  weapon: IWeapon | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function WeaponDetailSheet({
  weapon,
  onEdit,
  onDelete,
  ...props
}: WeaponDetailSheetProps) {
  if (!weapon) return null;

  // Format range for display
  const getFormattedRange = (): string => {
    if (!weapon.range || weapon.range.size === 0) return "Not specified";

    if (weapon.range.size === 1) {
      const value = Array.from(weapon.range.values())[0];
      return `${value}m`;
    }

    const rangeEntries = Array.from(weapon.range.entries());
    const value = rangeEntries[rangeEntries.length - 1][1];
    return String(value);
  };

  // Format damage for display
  const getFormattedDamage = (): string => {
    if (!weapon.baseDamage || weapon.baseDamage.length === 0)
      return "Not specified";

    if (weapon.baseDamage.length === 1) {
      return `${weapon.baseDamage[0]}`;
    }

    return `${weapon.baseDamage[0]}-${weapon.baseDamage[1]}`;
  };

  // Format weight for display
  const getFormattedWeight = (): string => {
    if (!weapon.weight || weapon.weight.length === 0) return "Not specified";

    if (weapon.weight.length === 1) {
      return `${weapon.weight[0]} kg`;
    }

    return `${weapon.weight[0]}-${weapon.weight[1]} kg`;
  };

  // Format weapon type for display
  const getWeaponTypeDisplay = (): string => {
    switch (weapon.type) {
      case WeaponType.MELEE:
        return "Melee Weapon";
      case WeaponType.RANGED:
        return "Ranged Weapon";
      case WeaponType.THROWING:
        return "Throwing Weapon";
      default:
        return weapon.type;
    }
  };

  // Determine badge variant based on weapon type
  const getTypeBadgeVariant = (): "default" | "destructive" | "outline" => {
    switch (weapon.type) {
      case WeaponType.MELEE:
        return "destructive";
      case WeaponType.RANGED:
        return "default";
      case WeaponType.THROWING:
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <Sheet {...props}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex justify-between items-center">
            <div>
              <SheetTitle className="text-2xl">{weapon.name}</SheetTitle>
              <div className="flex items-center mt-1">
                <Badge variant={getTypeBadgeVariant()}>
                  {getWeaponTypeDisplay()}
                </Badge>
                <span className="ml-2 text-muted-foreground">
                  {weapon.category}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-base px-3 py-1">
              {weapon.material}
            </Badge>
          </div>
          <SheetDescription className="mt-2">
            {weapon.description}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center">
              <BarChart2 className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Damage:</span>
              <span className="ml-2">{getFormattedDamage()}</span>
            </div>

            <div className="flex items-center">
              <Weight className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Weight:</span>
              <span className="ml-2">{getFormattedWeight()}</span>
            </div>

            <div className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Price:</span>
              <span className="ml-2">{weapon.price} Gold</span>
            </div>

            <div className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Material:</span>
              <span className="ml-2">{weapon.material}</span>
            </div>

            <div className="flex items-center">
              <Heart className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Durability:</span>
              <span className="ml-2">{weapon.durability}/100</span>
            </div>

            {weapon.range && weapon.range.size > 0 && (
              <div className="flex items-center">
                <Target className="mr-2 h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Max Range:</span>
                <span className="ml-2">{getFormattedRange()}</span>
              </div>
            )}
          </div>

          {/* Durability bar */}
          <div className="w-full space-y-2">
            <h3 className="font-medium mb-1">Condition</h3>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  weapon.durability > 75
                    ? "bg-green-500"
                    : weapon.durability > 50
                    ? "bg-yellow-500"
                    : weapon.durability > 25
                    ? "bg-orange-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${weapon.durability}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground">
              {weapon.durability}/100
              {weapon.durability > 90
                ? " (Excellent)"
                : weapon.durability > 75
                ? " (Good)"
                : weapon.durability > 50
                ? " (Used)"
                : weapon.durability > 25
                ? " (Worn)"
                : " (Heavily damaged)"}
            </p>
          </div>

          {/* Range Chart (only if values exist) */}
          {weapon.range && weapon.range.size > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Range Profile:</h3>
              <div className="border rounded-md p-4 bg-card">
                <RangeChart range={weapon.range} />
              </div>
            </div>
          )}

          {/* Weapon properties */}
          {weapon.properties && weapon.properties.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Properties:</h3>
              <div className="flex flex-wrap gap-2">
                {weapon.properties.map((property, index) => (
                  <Badge key={index} variant="outline">
                    {property}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Show grip types */}
          {weapon.grasp && weapon.grasp.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Grip Type:</h3>
              <div className="flex flex-wrap gap-2">
                {weapon.grasp.map((grasp, index) => (
                  <Badge key={index} variant="outline">
                    {grasp === GraspType.ONE_HANDED
                      ? "One-Handed"
                      : "Two-Handed"}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Weapon-specific information based on type */}
          {weapon.type === WeaponType.MELEE && (
            <div>
              <h3 className="font-medium mb-2">Melee Details:</h3>
              <p className="text-sm text-muted-foreground">
                This melee weapon can be used in direct contact with opponents.
                It's particularly effective against{" "}
                {weapon.category === WeaponCategory.AXES ||
                weapon.category === WeaponCategory.SWORDS
                  ? "unarmored opponents"
                  : weapon.category === WeaponCategory.HAMMERS ||
                    weapon.category === WeaponCategory.MACES
                  ? "armored opponents"
                  : "various opponent types"}
                .
              </p>
            </div>
          )}

          {weapon.type === WeaponType.RANGED && (
            <div>
              <h3 className="font-medium mb-2">Ranged Details:</h3>
              <p className="text-sm text-muted-foreground">
                This ranged weapon allows attacks from a safe distance.
                {weapon.category === WeaponCategory.BOWS
                  ? " Bows require arrows as ammunition and a steady hand for precise shots."
                  : weapon.category === WeaponCategory.CROSSBOWS
                  ? " Crossbows offer high precision and penetrating power, but need time to reload."
                  : weapon.category === WeaponCategory.FIREARMS
                  ? " Firearms cause great damage with an explosive charge, but are slow to reload."
                  : " This ranged weapon has unique properties."}
              </p>
            </div>
          )}

          {weapon.type === WeaponType.THROWING && (
            <div>
              <h3 className="font-medium mb-2">Throwing Weapon Details:</h3>
              <p className="text-sm text-muted-foreground">
                This throwing weapon can be used at a distance and causes
                {weapon.category === WeaponCategory.THROWING_WEAPONS
                  ? " medium to high damage. After throwing, the weapon must be collected or replaced."
                  : weapon.category === WeaponCategory.THROWABLE_ITEMS
                  ? " special effects or area damage. These items are typically consumables."
                  : " various types of damage depending on the target and throwing style."}
              </p>
            </div>
          )}

          {/* Image if available */}
          {weapon.imageUrl && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Image:</h3>
              <div className="border rounded-md p-2 bg-card flex justify-center">
                <img
                  src={weapon.imageUrl}
                  alt={weapon.name}
                  className="max-w-full max-h-64 object-contain"
                />
              </div>
            </div>
          )}
        </div>

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
