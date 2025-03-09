// src/components/weapons/weapons-table-toolbar-actions.tsx
"use client";
import { useState } from "react";

import { IWeapon } from "@/actions/weapons";
import { exportWeaponsAsJSON } from "@/actions/weapons-export";
import type { Table } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { exportTableToJSON } from "@/lib/export";

import { DeleteWeaponsDialog } from "./delete-weapons-dialog";
import { ImportWeaponsDialog } from "./import-weapons-dialog";

interface WeaponsTableToolbarActionsProps {
  table: Table<IWeapon>;
  onCreateWeapon?: () => void;
  onImportSuccess?: () => void;
}

export function WeaponsTableToolbarActions({
  table,
  onCreateWeapon,
  onImportSuccess,
}: WeaponsTableToolbarActionsProps) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;

  // Handle file import success
  const handleImportSuccess = () => {
    if (onImportSuccess) {
      onImportSuccess();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {hasSelectedRows ? (
        <>
          <DeleteWeaponsDialog
            weapons={selectedRows.map((row) => row.original)}
            onSuccess={() => {
              table.toggleAllRowsSelected(false);
              if (onImportSuccess) onImportSuccess(); // Refresh table after delete
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const selectedWeapons = selectedRows.map((row) => row.original);
                const weaponIds = selectedWeapons.map((weapon) => weapon.id);

                // Server-side export
                const result = await exportWeaponsAsJSON(weaponIds);

                // Create and download the file in the browser
                const blob = new Blob([result.json], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = result.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                toast.success(
                  `${weaponIds.length} weapons exported successfully`
                );
              } catch (error) {
                console.error("Error exporting weapons:", error);
                toast.error("Failed to export weapons");
              }
            }}
            className="gap-2"
          >
            <Download className="size-4" aria-hidden="true" />
            Export JSON
          </Button>
        </>
      ) : (
        <Button variant="outline" size="sm" disabled className="gap-2">
          <Download className="size-4" aria-hidden="true" />
          Export JSON
        </Button>
      )}

      <ImportWeaponsDialog onSuccess={handleImportSuccess} />

      <Button size="sm" className="gap-2" onClick={onCreateWeapon}>
        <Plus className="size-4" aria-hidden="true" />
        New Weapon
      </Button>
    </div>
  );
}
