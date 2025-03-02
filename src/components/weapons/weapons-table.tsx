"use client";

import { IWeapon, WeaponType, WeaponCategory, GraspType } from "@/types/weapon";
import type { DataTableFilterField, DataTableRowAction } from "@/types";
import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import { Sword, Target, Package, Grip } from "lucide-react";

import {
  translateWeaponType,
  getWeaponsColumns,
} from "./weapons-table-columns";
import { WeaponsTableFloatingBar } from "./weapons-table-floating-bar";
import { WeaponsTableToolbarActions } from "./weapons-table-toolbar-actions";
import { DeleteWeaponDialog } from "./delete-weapons-dialog";
// import { UpdateWeaponSheet } from "./update-weapons-sheet";

interface WeaponsTableProps {
  weapons: IWeapon[];
}

export function WeaponsTable({ weapons }: WeaponsTableProps) {
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<IWeapon> | null>(null);

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

  const columns = React.useMemo(() => getWeaponsColumns({ setRowAction }), []);

  const filterFields: DataTableFilterField<IWeapon>[] = [
    {
      id: "name",
      label: "Name",
      placeholder: "Waffen suchen...",
    },
    {
      id: "type",
      label: "Typ",
      options: Object.values(WeaponType).map((type) => ({
        label: translateWeaponType(type),
        value: type,
        icon: type === WeaponType.MELEE ? Sword : Target,
        count: typeCount[type] || 0,
      })),
    },
    {
      id: "category",
      label: "Kategorie",
      options: Object.values(WeaponCategory).map((category) => ({
        label: category,
        value: category,
        icon: Package,
        count: categoryCount[category] || 0,
      })),
    },
    {
      id: "grasp",
      label: "Griffart",
      options: Object.values(GraspType).map((grasp) => ({
        label: grasp === GraspType.ONE_HANDED ? "Einhändig" : "Zweihändig",
        value: grasp,
        icon: Grip,
        count: graspCount[grasp] || 0,
      })),
    },
  ];

  // Use the data table hook
  const { table } = useDataTable<IWeapon>({
    data: weapons,
    columns,
    filterFields,
    pageCount: 1, // For now, single page
    enableAdvancedFilter: false,
    initialState: {
      sorting: [{ id: "name", desc: false }],
      columnVisibility: { material: false }, // Hide material column by default
      pagination: {
        pageSize: 10,
      },
    },
    getRowId: (weapon: IWeapon) => weapon.id,
  });

  return (
    <>
      <DataTable
        table={table}
        floatingBar={<WeaponsTableFloatingBar table={table} />}
      >
        <DataTableToolbar table={table} filterFields={filterFields}>
          <WeaponsTableToolbarActions table={table} />
        </DataTableToolbar>
      </DataTable>

      {/* Action Dialogs */}
      <DeleteWeaponDialog
        open={rowAction?.type === "delete"}
        onOpenChange={() => setRowAction(null)}
        weapon={rowAction?.row.original ?? null}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />

      {/* <UpdateWeaponSheet
        open={rowAction?.type === "update"}
        onOpenChange={() => setRowAction(null)}
        weapon={rowAction?.row.original ?? null}
      /> */}
    </>
  );
}
