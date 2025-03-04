"use client";

import { IMaterial } from "@/types/material";
import type { Table } from "@tanstack/react-table";
import { Download, Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportTableToJSON } from "@/lib/export";

import { DeleteMaterialsDialog } from "./delete-materials-dialog";

interface MaterialsTableToolbarActionsProps {
  table: Table<IMaterial>;
  onCreateMaterial?: () => void;
}

export function MaterialsTableToolbarActions({
  table,
  onCreateMaterial,
}: MaterialsTableToolbarActionsProps) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;

  return (
    <div className="flex items-center gap-2">
      {hasSelectedRows ? (
        <>
          <DeleteMaterialsDialog
            materials={selectedRows.map((row) => row.original)}
            onSuccess={() => table.toggleAllRowsSelected(false)}
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

      <Button size="sm" className="gap-2" onClick={onCreateMaterial}>
        <Plus className="size-4" aria-hidden="true" />
        New Material
      </Button>
    </div>
  );
}
