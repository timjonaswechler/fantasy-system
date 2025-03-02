"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Filter, X, CirclePlus } from "lucide-react";
import { IWeapon, WeaponType, WeaponCategory, GraspType } from "@/types/weapon";
import { useRouter } from "next/navigation";
import { deleteWeapon } from "@/actions/weapons";
import { toast } from "sonner";

interface WeaponsListProps {
  initialWeapons: IWeapon[];
}

export const WeaponsList = ({ initialWeapons }: WeaponsListProps) => {
  const router = useRouter();
  const [weapons, setWeapons] = useState<IWeapon[]>(initialWeapons);
  const [filteredWeapons, setFilteredWeapons] =
    useState<IWeapon[]>(initialWeapons);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<WeaponType[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<
    WeaponCategory[]
  >([]);
  const [selectedGrasp, setSelectedGrasp] = useState<string[]>([]);

  // For dynamic filtering of categories based on selected types
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  // For dynamic filtering of grasp options based on selected types/categories
  const [availableGrasps, setAvailableGrasps] = useState<string[]>([]);

  useEffect(() => {
    // Initialize available categories and grasps
    const allCategories = [
      ...new Set(weapons.map((weapon) => weapon.category)),
    ];
    setAvailableCategories(allCategories);

    // Map all grasp types from the data
    const allGrasps = [...new Set(weapons.flatMap((weapon) => weapon.grasp))];
    setAvailableGrasps(allGrasps);
  }, [weapons]);

  useEffect(() => {
    // Update available categories based on selected types
    if (selectedTypes.length > 0) {
      const filteredByType = weapons.filter((weapon) =>
        selectedTypes.includes(weapon.type)
      );
      const categoriesForType = [
        ...new Set(filteredByType.map((weapon) => weapon.category)),
      ];
      setAvailableCategories(categoriesForType);
    } else {
      // If no types selected, show all categories
      const allCategories = [
        ...new Set(weapons.map((weapon) => weapon.category)),
      ];
      setAvailableCategories(allCategories);
    }

    // Update available grasps based on selected types and categories
    let filteredForGrasps = [...weapons];

    if (selectedTypes.length > 0) {
      filteredForGrasps = filteredForGrasps.filter((weapon) =>
        selectedTypes.includes(weapon.type)
      );
    }

    if (selectedCategories.length > 0) {
      filteredForGrasps = filteredForGrasps.filter((weapon) =>
        selectedCategories.includes(weapon.category)
      );
    }

    const graspsForSelection = [
      ...new Set(filteredForGrasps.flatMap((weapon) => weapon.grasp)),
    ];
    setAvailableGrasps(graspsForSelection);

    // Main filtering logic for the weapon list
    let result = weapons;

    if (searchQuery) {
      result = result.filter(
        (weapon) =>
          weapon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          weapon.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedTypes.length > 0) {
      result = result.filter((weapon) => selectedTypes.includes(weapon.type));
    }

    if (selectedCategories.length > 0) {
      result = result.filter((weapon) =>
        selectedCategories.includes(weapon.category)
      );
    }

    if (selectedGrasp.length > 0) {
      result = result.filter((weapon) =>
        selectedGrasp.every((g) => weapon.grasp.includes(g as GraspType))
      );
    }

    setFilteredWeapons(result);
  }, [searchQuery, selectedTypes, selectedCategories, selectedGrasp, weapons]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTypeFilter = (type: WeaponType) => {
    setSelectedTypes((current) => {
      if (current.includes(type)) {
        return current.filter((t) => t !== type);
      } else {
        return [...current, type];
      }
    });

    // Reset category filter if it's not available for the selected type
    setSelectedCategories((prev) => {
      const newTypes = selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes, type];

      if (newTypes.length === 0) return prev; // Keep categories if no types selected

      // Filter weapons by the new type selection
      const filteredByNewTypes = weapons.filter((weapon) =>
        newTypes.includes(weapon.type)
      );
      // Get available categories for the filtered weapons
      const categoriesForNewTypes = [
        ...new Set(filteredByNewTypes.map((weapon) => weapon.category)),
      ];

      // Keep only categories that are available for the selected types
      return prev.filter((cat) => categoriesForNewTypes.includes(cat));
    });
  };

  const handleCategoryFilter = (category: WeaponCategory) => {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((c) => c !== category);
      } else {
        return [...current, category];
      }
    });

    // Reset type filter if it's not available for the selected category
    setSelectedTypes((prev) => {
      const newCategories = selectedCategories.includes(category)
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories, category];

      if (newCategories.length === 0) return prev; // Keep types if no categories selected

      // Filter weapons by the new category selection
      const filteredByNewCategories = weapons.filter((weapon) =>
        newCategories.includes(weapon.category)
      );
      // Get available types for the filtered weapons
      const typesForNewCategories = [
        ...new Set(filteredByNewCategories.map((weapon) => weapon.type)),
      ];

      // Keep only types that are available for the selected categories
      return prev.filter((type) => typesForNewCategories.includes(type));
    });
  };

  const handleGraspFilter = (grasp: string) => {
    // Convert UI grasp label to enum value
    const graspValue =
      grasp === "Einhändig"
        ? GraspType.ONE_HANDED
        : grasp === "Zweihändig"
        ? GraspType.TWO_HANDED
        : grasp; // Keep as is for other values like "Vielseitig"

    setSelectedGrasp((current) => {
      if (current.includes(graspValue)) {
        return current.filter((g) => g !== graspValue);
      } else {
        return [...current, graspValue];
      }
    });
  };

  // Helper function to display grasp in German
  const displayGrasp = (grasp: string): string => {
    switch (grasp) {
      case GraspType.ONE_HANDED:
        return "Einhändig";
      case GraspType.TWO_HANDED:
        return "Zweihändig";
      default:
        return grasp;
    }
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedCategories([]);
    setSelectedGrasp([]);
    setSearchQuery("");
  };

  const getDisplayableRange = (range?: Map<number, number>): string => {
    if (!range || range.size === 0) return "N/A";

    // If only one value is present
    if (range.size === 1) {
      const value = Array.from(range.values())[0];
      return `${value} m`;
    }

    // If multiple values are present (e.g. precision/distance)
    const values = Array.from(range.values());
    // We use the highest value as the range for the simplified view
    return `${Math.max(...values)} m`;
  };

  const handleDeleteWeapon = async (id: string) => {
    try {
      const confirmed = window.confirm(
        "Möchtest du diese Waffe wirklich löschen?"
      );
      if (!confirmed) return;

      const result = await deleteWeapon(id);
      if (result.success) {
        toast.success("Waffe wurde erfolgreich gelöscht");
        // Update the local state to reflect the deletion
        setWeapons(weapons.filter((weapon) => weapon.id !== id));
      }
    } catch (error) {
      console.error("Error deleting weapon:", error);
      toast.error("Fehler beim Löschen der Waffe");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Input
          placeholder="Waffen suchen..."
          value={searchQuery}
          onChange={handleSearch}
          className="max-w-sm"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 border-dashed">
              <CirclePlus className="mr-2 h-4 w-4" />
              Typ
              {selectedTypes.length > 0 && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal lg:hidden"
                  >
                    {selectedTypes.length}
                  </Badge>
                  <div className="hidden space-x-1 lg:flex">
                    {selectedTypes.length > 2 ? (
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {selectedTypes.length} ausgewählt
                      </Badge>
                    ) : (
                      selectedTypes.map((type) => (
                        <Badge
                          variant="secondary"
                          key={type}
                          className="rounded-sm px-1 font-normal"
                        >
                          {type === WeaponType.MELEE
                            ? "Nahkampf"
                            : type === WeaponType.RANGED
                            ? "Fernkampf"
                            : "Wurf"}
                        </Badge>
                      ))
                    )}
                  </div>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => handleTypeFilter(WeaponType.MELEE)}
            >
              <div
                className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${
                  selectedTypes.includes(WeaponType.MELEE)
                    ? "bg-primary text-primary-foreground"
                    : "opacity-50 [&_svg]:invisible"
                }`}
              >
                <X className="h-3 w-3" />
              </div>
              Nahkampfwaffen
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleTypeFilter(WeaponType.RANGED)}
            >
              <div
                className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${
                  selectedTypes.includes(WeaponType.RANGED)
                    ? "bg-primary text-primary-foreground"
                    : "opacity-50 [&_svg]:invisible"
                }`}
              >
                <X className="h-3 w-3" />
              </div>
              Fernkampfwaffen
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleTypeFilter(WeaponType.THROWING)}
            >
              <div
                className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${
                  selectedTypes.includes(WeaponType.THROWING)
                    ? "bg-primary text-primary-foreground"
                    : "opacity-50 [&_svg]:invisible"
                }`}
              >
                <X className="h-3 w-3" />
              </div>
              Wurfwaffen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 border-dashed">
              <CirclePlus className="mr-2 h-4 w-4" />
              Kategorie
              {selectedCategories.length > 0 && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal lg:hidden"
                  >
                    {selectedCategories.length}
                  </Badge>
                  <div className="hidden space-x-1 lg:flex">
                    {selectedCategories.length > 2 ? (
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {selectedCategories.length} ausgewählt
                      </Badge>
                    ) : (
                      selectedCategories.map((category) => (
                        <Badge
                          variant="secondary"
                          key={category}
                          className="rounded-sm px-1 font-normal"
                        >
                          {category}
                        </Badge>
                      ))
                    )}
                  </div>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {/* Only show categories that are available based on the selected type */}
            {availableCategories.map((category) => (
              <DropdownMenuItem
                key={category}
                onClick={() => handleCategoryFilter(category as WeaponCategory)}
              >
                <div
                  className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${
                    selectedCategories.includes(category as WeaponCategory)
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  }`}
                >
                  <X className="h-3 w-3" />
                </div>
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 border-dashed">
              <CirclePlus className="mr-2 h-4 w-4" />
              Griff
              {selectedGrasp.length > 0 && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal lg:hidden"
                  >
                    {selectedGrasp.length}
                  </Badge>
                  <div className="hidden space-x-1 lg:flex">
                    {selectedGrasp.length > 2 ? (
                      <Badge
                        variant="secondary"
                        className="rounded-sm px-1 font-normal"
                      >
                        {selectedGrasp.length} ausgewählt
                      </Badge>
                    ) : (
                      selectedGrasp.map((grasp) => (
                        <Badge
                          variant="secondary"
                          key={grasp}
                          className="rounded-sm px-1 font-normal"
                        >
                          {displayGrasp(grasp)}
                        </Badge>
                      ))
                    )}
                  </div>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {/* Map availableGrasps to UI labels */}
            {availableGrasps.map((grasp) => (
              <DropdownMenuItem
                key={grasp}
                onClick={() => handleGraspFilter(displayGrasp(grasp))}
              >
                <div
                  className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${
                    selectedGrasp.includes(grasp)
                      ? "bg-primary text-primary-foreground"
                      : "opacity-50 [&_svg]:invisible"
                  }`}
                >
                  <X className="h-3 w-3" />
                </div>
                {displayGrasp(grasp)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(selectedTypes.length > 0 ||
          selectedCategories.length > 0 ||
          selectedGrasp.length > 0 ||
          searchQuery) && (
          <Button
            variant="ghost"
            onClick={resetFilters}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table className="rounded-md">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Kategorie</TableHead>
              <TableHead>Schaden</TableHead>
              <TableHead>Reichweite</TableHead>
              <TableHead>Gewicht</TableHead>
              <TableHead>Preis</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWeapons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Keine Waffen gefunden
                </TableCell>
              </TableRow>
            ) : (
              filteredWeapons.map((weapon) => (
                <TableRow
                  key={weapon.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/weapons/${weapon.id}`)}
                >
                  {/* Waffen Name */}
                  <TableCell className="font-medium">{weapon.name}</TableCell>

                  {/* Waffen Type */}
                  <TableCell>
                    <Badge
                      className={
                        weapon.type === WeaponType.MELEE
                          ? "bg-red-600"
                          : weapon.type === WeaponType.RANGED
                          ? "bg-sky-600"
                          : "bg-emerald-600"
                      }
                    >
                      {weapon.type === WeaponType.MELEE
                        ? "Nahkampf"
                        : weapon.type === WeaponType.RANGED
                        ? "Fernkampf"
                        : "Wurf"}
                    </Badge>
                  </TableCell>

                  {/* Waffen Kategorie */}
                  <TableCell>
                    <Badge
                      className={
                        //MELLEE
                        weapon.category === WeaponCategory.DAGGERS
                          ? "bg-red-600"
                          : weapon.category === WeaponCategory.SWORDS
                          ? "bg-orange-600"
                          : weapon.category === WeaponCategory.MACES
                          ? "bg-amber-600"
                          : weapon.category === WeaponCategory.SPEARS
                          ? "bg-yellow-600"
                          : weapon.category === WeaponCategory.AXES
                          ? "bg-lime-600"
                          : weapon.category === WeaponCategory.FLAILS
                          ? "bg-green-600"
                          : weapon.category === WeaponCategory.CLEAVERS
                          ? "bg-emerald-600"
                          : weapon.category === WeaponCategory.HAMMERS
                          ? "bg-teal-600"
                          : weapon.category === WeaponCategory.POLEARMS
                          ? "bg-cyan-600"
                          : weapon.category === WeaponCategory.BOWS
                          ? "bg-sky-600"
                          : weapon.category === WeaponCategory.CROSSBOWS
                          ? "bg-blue-600"
                          : weapon.category === WeaponCategory.FIREARMS
                          ? "bg-violet-600"
                          : weapon.category === WeaponCategory.THROWING_WEAPONS
                          ? "bg-purple-600"
                          : "bg-fuchsia-600"
                      }
                    >
                      {weapon.category}
                    </Badge>
                  </TableCell>

                  {/* Waffen Schaden */}
                  <TableCell>
                    {weapon.baseDamage && weapon.baseDamage.length > 0
                      ? weapon.baseDamage.length > 1
                        ? `${weapon.baseDamage[0]}-${weapon.baseDamage[1]}`
                        : weapon.baseDamage[0]
                      : "N/A"}
                  </TableCell>

                  {/* Waffen Reichweite */}
                  <TableCell>{getDisplayableRange(weapon.range)}</TableCell>

                  {/* Waffen Gewicht */}
                  <TableCell>
                    {weapon.weight && weapon.weight.length > 0
                      ? weapon.weight.length > 1
                        ? `${weapon.weight[0]}-${weapon.weight[1]} kg`
                        : `${weapon.weight[0]} kg`
                      : "N/A"}
                  </TableCell>

                  {/* Preis */}
                  <TableCell>{weapon.price || "N/A"}</TableCell>

                  {/* Material */}
                  <TableCell>{weapon.material || "N/A"}</TableCell>

                  {/* Actions */}
                  <TableCell
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/weapons/${weapon.id}/edit`);
                      }}
                    >
                      Bearbeiten
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWeapon(weapon.id);
                      }}
                    >
                      Löschen
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
