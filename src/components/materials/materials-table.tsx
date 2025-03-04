"use client";

import { IMaterial, MaterialCategory } from "@/types/material";
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

import { getColumns } from "./materials-table-columns";
import { MaterialsTableToolbarActions } from "./materials-table-toolbar-actions";
import { DeleteMaterialsDialog } from "./delete-materials-dialog";
import { MaterialUpdateSheet } from "./material-update-sheet";
import { MaterialDetailSheet } from "./material-detail-sheet";
import { MaterialCreateSheet } from "./material-create-sheet";

interface MaterialsTableProps {
  materials: IMaterial[];
}

export function MaterialsTable({ materials }: MaterialsTableProps) {
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<IMaterial> | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = React.useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);
  const [selectedMaterial, setSelectedMaterial] =
    React.useState<IMaterial | null>(null);

  // Function to handle viewing a material's details
  const handleViewMaterial = (material: IMaterial) => {
    setSelectedMaterial(material);
    setIsDetailSheetOpen(true);
  };

  // Function to handle editing a material
  const handleEditMaterial = (material: IMaterial) => {
    setRowAction({ row: { original: material } as any, type: "update" });
  };

  // Function to handle deleting a material
  const handleDeleteMaterial = (material: IMaterial) => {
    setRowAction({ row: { original: material } as any, type: "delete" });
  };

  // Function to handle creating a new material
  const handleCreateMaterial = () => {
    setIsCreateSheetOpen(true);
  };

  // Function to handle refreshing the materials list (after changes)
  const handleRefresh = () => {
    // In a real app, you might want to refetch data from the server
    // For now, we'll just log that we would refresh
    console.log("Refreshing materials list");
  };

  // Custom columns with a view action added
  const customColumns = React.useMemo(() => {
    const cols = getColumns({
      setRowAction,
      onViewMaterial: handleViewMaterial,
    });
    return cols;
  }, []);

  // Calculate category counts for filters
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    materials.forEach((material) => {
      counts[material.category] = (counts[material.category] || 0) + 1;
    });
    return counts;
  }, [materials]);

  // Define filters
  const filterFields = [
    {
      id: "name",
      label: "Name",
      placeholder: "Filter by name...",
    },
    {
      id: "category",
      label: "Category",
      options: Object.values(MaterialCategory).map((category) => ({
        label: toSentenceCase(category.toLowerCase()),
        value: category,
        count: categoryCounts[category] || 0,
      })),
    },
    {
      id: "color",
      label: "Color",
      placeholder: "Filter by color...",
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
      density: false,
      impactYield: false,
      impactFracture: false,
      shearYield: false,
      shearFracture: false,
    });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Create table
  const table = useReactTable({
    data: materials,
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
  });

  return (
    <>
      <DataTable table={table}>
        <DataTableToolbar table={table} filterFields={filterFields}>
          <MaterialsTableToolbarActions
            table={table}
            onCreateMaterial={handleCreateMaterial}
          />
        </DataTableToolbar>
      </DataTable>

      {/* Material Detail Sheet */}
      <MaterialDetailSheet
        material={selectedMaterial}
        open={isDetailSheetOpen}
        onOpenChange={setIsDetailSheetOpen}
        onEdit={() => {
          setIsDetailSheetOpen(false);
          if (selectedMaterial) {
            handleEditMaterial(selectedMaterial);
          }
        }}
        onDelete={() => {
          setIsDetailSheetOpen(false);
          if (selectedMaterial) {
            handleDeleteMaterial(selectedMaterial);
          }
        }}
      />

      {/* Update Sheet */}
      <MaterialUpdateSheet
        open={rowAction?.type === "update"}
        onOpenChange={(open) => {
          if (!open) {
            setRowAction(null);
            handleRefresh(); // Call refresh when Sheet closes instead
          }
        }}
        material={rowAction?.row.original ?? null}
      />

      {/* Create material Sheet */}
      <MaterialCreateSheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        onSuccess={handleRefresh}
      />

      {/* Delete dialog */}
      <DeleteMaterialsDialog
        open={rowAction?.type === "delete"}
        onOpenChange={() => setRowAction(null)}
        materials={rowAction?.row.original ? [rowAction?.row.original] : []}
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
