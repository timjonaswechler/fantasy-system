"use client";

import { IWeapon } from "@/actions/weapons";
import type { DataTableRowAction } from "@/types";
import * as React from "react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import {
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import { toSentenceCase } from "@/lib/utils";

import { DeleteWeaponsDialog } from "./delete-weapons-dialog";
import { getColumns } from "./weapons-table-columns";
import { WeaponsTableToolbarActions } from "./weapons-table-toolbar-actions";
import { UpdateWeaponSheet } from "./update-weapon-sheet";
import { WeaponCategory, WeaponType, GraspType } from "@/types/weapon";

interface WeaponsTableProps {
  weapons: IWeapon[];
}

export function WeaponsTable({ weapons }: WeaponsTableProps) {
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<IWeapon> | null>(null);

  const columns = React.useMemo(() => getColumns({ setRowAction }), []);

  // Calculate type, category, and grasp counts for filters
  const typeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    weapons.forEach((weapon) => {
      counts[weapon.type] = (counts[weapon.type] || 0) + 1;
    });
    return counts;
  }, [weapons]);

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    weapons.forEach((weapon) => {
      counts[weapon.category] = (counts[weapon.category] || 0) + 1;
    });
    return counts;
  }, [weapons]);

  const graspCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    weapons.forEach((weapon) => {
      weapon.grasp.forEach((graspType) => {
        counts[graspType] = (counts[graspType] || 0) + 1;
      });
    });
    return counts;
  }, [weapons]);

  // Define filters
  const filterFields = [
    {
      id: "name",
      label: "Name",
      placeholder: "Filter by name...",
    },
    {
      id: "type",
      label: "Type",
      options: Object.values(WeaponType).map((type) => ({
        label: toSentenceCase(type),
        value: type,
        count: typeCounts[type] || 0,
      })),
    },
    {
      id: "category",
      label: "Category",
      options: Object.values(WeaponCategory).map((category) => ({
        label: toSentenceCase(category),
        value: category,
        count: categoryCounts[category] || 0,
      })),
    },
    {
      id: "grasp",
      label: "Grasp",
      options: Object.values(GraspType).map((grasp) => ({
        label: toSentenceCase(grasp),
        value: grasp,
        count: graspCounts[grasp] || 0,
      })),
    },
  ];

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Create table
  const table = useReactTable({
    data: weapons,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    // Custom filter function for arrays like grasp
    filterFns: {
      customFilter: (row, columnId, value) => {
        if (!value || value.length === 0) return true;

        // Handle grasp array filtering
        if (columnId === "grasp") {
          return row.original.grasp.some((graspType) =>
            value.includes(graspType)
          );
        }

        // Handle other properties
        const cellValue = String(row.getValue(columnId) || "").toLowerCase();

        // For multi-select filters
        if (Array.isArray(value)) {
          return value.some((v) => cellValue.includes(v.toLowerCase()));
        }

        // For text search
        return cellValue.includes(String(value).toLowerCase());
      },
    },
  });

  return (
    <>
      <DataTable table={table}>
        <DataTableToolbar table={table} filterFields={filterFields}>
          <WeaponsTableToolbarActions table={table} />
        </DataTableToolbar>
      </DataTable>

      {/* Update dialog */}
      <UpdateWeaponSheet
        open={rowAction?.type === "update"}
        onOpenChange={() => setRowAction(null)}
        weapon={rowAction?.row.original ?? null}
      />

      {/* Delete dialog */}
      <DeleteWeaponsDialog
        open={rowAction?.type === "delete"}
        onOpenChange={() => setRowAction(null)}
        weapons={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />
    </>
  );
}
