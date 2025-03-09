// src/components/weapons/weapons-table.tsx
"use client";

import { IWeapon, getWeapons, getWeaponById } from "@/actions/weapons";
import type { DataTableRowAction } from "@/types";
import * as React from "react";
import { toast } from "sonner";

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

import { getColumns } from "./weapons-table-columns";
import { WeaponsTableToolbarActions } from "./weapons-table-toolbar-actions";
import { DeleteWeaponsDialog } from "./delete-weapons-dialog";
import { WeaponUpdateSheet } from "./weapon-update-sheet";
import { WeaponDetailSheet } from "./weapon-detail-sheet";
import { WeaponCreateSheet } from "./weapon-create-sheet";
import { WeaponType, WeaponCategory, GraspType } from "@/types/weapon";

interface WeaponsTableProps {
  weapons: IWeapon[];
}

export function WeaponsTable({ weapons: initialWeapons }: WeaponsTableProps) {
  const [weapons, setWeapons] = React.useState<IWeapon[]>(initialWeapons);
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<IWeapon> | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = React.useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);
  const [selectedWeapon, setSelectedWeapon] = React.useState<IWeapon | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Function to handle viewing a weapon's details
  const handleViewWeapon = (weapon: IWeapon) => {
    setSelectedWeapon(weapon);
    setIsDetailSheetOpen(true);
  };

  // Function to handle editing a weapon
  const handleEditWeapon = (weapon: IWeapon) => {
    setRowAction({ row: { original: weapon } as any, type: "update" });
  };

  // Function to handle deleting a weapon
  const handleDeleteWeapon = (weapon: IWeapon) => {
    setRowAction({ row: { original: weapon } as any, type: "delete" });
  };

  // Function to handle creating a new weapon
  const handleCreateWeapon = () => {
    setIsCreateSheetOpen(true);
  };

  // Function to handle refreshing the weapons list after changes
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      // Load data without full page refresh
      const updatedWeapons = await getWeapons();
      setWeapons(updatedWeapons);

      // Reset table to ensure sorting and filtering are correctly applied
      table.reset();

      // Optional: Success notification
      toast.success("Weapons list updated");
    } catch (error) {
      console.error("Error refreshing weapons:", error);
      toast.error("Failed to refresh weapons");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Custom columns with a view action added
  const customColumns = React.useMemo(() => {
    const cols = getColumns({
      setRowAction,
      onViewWeapon: handleViewWeapon,
    });
    return cols;
  }, []);

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
    React.useState<VisibilityState>({
      description: false,
      material: false,
      imageUrl: false,
      weight: false,
      properties: false,
      durability: false,
      range: false,
    });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Create table
  const table = useReactTable({
    data: weapons,
    columns: customColumns,
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
          return row.original.grasp.some((graspType: GraspType) =>
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
          <WeaponsTableToolbarActions
            table={table}
            onCreateWeapon={handleCreateWeapon}
            onImportSuccess={handleRefresh}
          />
        </DataTableToolbar>
      </DataTable>

      {/* Weapon Detail Sheet */}
      <WeaponDetailSheet
        weapon={selectedWeapon}
        open={isDetailSheetOpen}
        onOpenChange={setIsDetailSheetOpen}
        onEdit={() => {
          setIsDetailSheetOpen(false);
          if (selectedWeapon) {
            handleEditWeapon(selectedWeapon);
          }
        }}
        onDelete={() => {
          setIsDetailSheetOpen(false);
          if (selectedWeapon) {
            handleDeleteWeapon(selectedWeapon);
          }
        }}
      />

      {/* Update Sheet */}
      <WeaponUpdateSheet
        open={rowAction?.type === "update"}
        onOpenChange={(open) => {
          if (!open) {
            setRowAction(null);
            handleRefresh(); // Call refresh when Sheet closes
          }
        }}
        weapon={rowAction?.row.original ?? null}
      />

      {/* Create weapon Sheet */}
      <WeaponCreateSheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        onSuccess={handleRefresh}
      />

      {/* Delete dialog */}
      <DeleteWeaponsDialog
        open={rowAction?.type === "delete"}
        onOpenChange={() => setRowAction(null)}
        weapons={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => {
          if (rowAction?.row.toggleSelected) {
            rowAction?.row.toggleSelected(false);
          }
          handleRefresh();
        }}
      />
    </>
  );
}
