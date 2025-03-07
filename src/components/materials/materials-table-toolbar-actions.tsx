// src/components/materials/materials-table-toolbar-actions.tsx
"use client";
import { useState } from "react";

import { IMaterial } from "@/types/material";
import type { Table } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { exportTableToJSON } from "@/lib/export";

import { DeleteMaterialsDialog } from "./delete-materials-dialog";
import { FileUploadDialog } from "@/components/ui/file-upload-dialog";
import { ImportMaterialsDialog } from "./import-materials-dialog";

interface MaterialsTableToolbarActionsProps {
  table: Table<IMaterial>;
  onCreateMaterial?: () => void;
  onImportSuccess?: () => void;
}

export function MaterialsTableToolbarActions({
  table,
  onCreateMaterial,
  onImportSuccess,
}: MaterialsTableToolbarActionsProps) {
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
          <DeleteMaterialsDialog
            materials={selectedRows.map((row) => row.original)}
            onSuccess={() => {
              table.toggleAllRowsSelected(false);
              if (onImportSuccess) onImportSuccess(); // Refresh table after delete
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportTableToJSON(table, {
                filename: "materials",
                excludeColumns: ["select", "actions"],
                onlySelected: true,
              })
            }
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

      <ImportMaterialsDialog onSuccess={handleImportSuccess} />

      <Button size="sm" className="gap-2" onClick={onCreateMaterial}>
        <Plus className="size-4" aria-hidden="true" />
        Neues Material
      </Button>
    </div>
  );
}
