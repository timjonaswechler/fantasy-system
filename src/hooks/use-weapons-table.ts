// src/hooks/use-weapons-table.ts
"use client";

import { useState } from "react";
import { IWeapon, WeaponType, WeaponCategory, GraspType } from "@/types/weapon";
import { getWeaponsColumns } from "@/components/weapons/weapons-table-columns";
import { useDataTable } from "@/hooks/use-data-table"; // This hook will be adapted from the shadcn repo

export function useWeaponsTable(initialWeapons: IWeapon[]) {
  const [weapons, setWeapons] = useState<IWeapon[]>(initialWeapons);

  // Get weapon count by type for filter badges
  const typeCount = weapons.reduce((acc, weapon) => {
    acc[weapon.type] = (acc[weapon.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get weapon count by category for filter badges
  const categoryCount = weapons.reduce((acc, weapon) => {
    acc[weapon.category] = (acc[weapon.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get weapon count by grasp type for filter badges
  const graspCount: Record<string, number> = {};
  weapons.forEach((weapon) => {
    weapon.grasp.forEach((grasp) => {
      graspCount[grasp] = (graspCount[grasp] || 0) + 1;
    });
  });

  const columns = getWeaponsColumns();

  // Define filter fields for the data table
  const filterFields = [
    {
      id: "name",
      label: "Name",
      placeholder: "Waffen suchen...",
    },
    {
      id: "type",
      label: "Typ",
      options: Object.values(WeaponType).map((type) => ({
        label:
          type === WeaponType.MELEE
            ? "Nahkampf"
            : type === WeaponType.RANGED
            ? "Fernkampf"
            : "Wurf",
        value: type,
        count: typeCount[type] || 0,
      })),
    },
    {
      id: "category",
      label: "Kategorie",
      options: Object.values(WeaponCategory).map((category) => ({
        label: category,
        value: category,
        count: categoryCount[category] || 0,
      })),
    },
    {
      id: "grasp",
      label: "Griff",
      options: Object.values(GraspType).map((grasp) => ({
        label: grasp === GraspType.ONE_HANDED ? "Einhändig" : "Zweihändig",
        value: grasp,
        count: graspCount[grasp] || 0,
      })),
    },
  ];

  // Use the data table hook from shadcn-table
  const { table } = useDataTable({
    data: weapons,
    columns,
    filterFields,
    pageCount: 1, // Initially just one page
    enableAdvancedFilter: false,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return {
    table,
    filterFields,
    weapons,
    setWeapons,
  };
}
