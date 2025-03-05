// src/components/materials/materials-table.tsx
"use client";

import { IMaterial } from "@/types/material";
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
import { MaterialCategory } from "@/types/material";

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

  // Funktion zum Anzeigen der Material-Details
  const handleViewMaterial = (material: IMaterial) => {
    setSelectedMaterial(material);
    setIsDetailSheetOpen(true);
  };

  // Funktion zum Bearbeiten eines Materials
  const handleEditMaterial = (material: IMaterial) => {
    setRowAction({ row: { original: material } as any, type: "update" });
  };

  // Funktion zum Löschen eines Materials
  const handleDeleteMaterial = (material: IMaterial) => {
    setRowAction({ row: { original: material } as any, type: "delete" });
  };

  // Funktion zum Erstellen eines neuen Materials
  const handleCreateMaterial = () => {
    setIsCreateSheetOpen(true);
  };

  // Funktion zum Aktualisieren der Materialliste nach Änderungen
  const handleRefresh = () => {
    console.log("Aktualisiere Materialliste");
  };

  // Spalten mit View-Aktion
  const customColumns = React.useMemo(() => {
    const cols = getColumns({
      setRowAction,
      onViewMaterial: handleViewMaterial,
    });
    return cols;
  }, []);

  // Zählen der Materialien pro Kategorie für Filter
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    materials.forEach((material) => {
      counts[material.category] = (counts[material.category] || 0) + 1;
    });
    return counts;
  }, [materials]);

  // Filter definieren
  const filterFields = [
    {
      id: "name",
      label: "Name",
      placeholder: "Filter nach Name...",
    },
    {
      id: "category",
      label: "Kategorie",
      options: Object.values(MaterialCategory).map((category) => ({
        label: toSentenceCase(category),
        value: category,
        count: categoryCounts[category] || 0,
      })),
    },
  ];

  // Tabellen-State
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      description: false,
    });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Tabelle erstellen
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

      {/* Material-Details-Sheet */}
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

      {/* Update-Sheet */}
      <MaterialUpdateSheet
        open={rowAction?.type === "update"}
        onOpenChange={(open) => {
          if (!open) {
            setRowAction(null);
            handleRefresh();
          }
        }}
        material={rowAction?.row.original ?? null}
      />

      {/* Material erstellen Sheet */}
      <MaterialCreateSheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        onSuccess={handleRefresh}
      />

      {/* Lösch-Dialog */}
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
