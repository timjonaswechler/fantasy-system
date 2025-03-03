"use client";

import { IWeapon } from "@/actions/weapons";
import type { Table } from "@tanstack/react-table";
import { Download, Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportTableToJSON } from "@/lib/export";

import { DeleteWeaponsDialog } from "./delete-weapons-dialog";
import { ImportWeaponsDialog } from "./import-weapons-dialog";

interface WeaponsTableToolbarActionsProps {
  table: Table<IWeapon>;
  onCreateWeapon?: () => void;
}

export function WeaponsTableToolbarActions({
  table,
  onCreateWeapon,
}: WeaponsTableToolbarActionsProps) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;

  return (
    <div className="flex items-center gap-2">
      {hasSelectedRows ? (
        <>
          <DeleteWeaponsDialog
            weapons={selectedRows.map((row) => row.original)}
            onSuccess={() => table.toggleAllRowsSelected(false)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportTableToJSON(table, {
                filename: "weapons",
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

      <ImportWeaponsDialog onSuccess={onCreateWeapon} />

      <Button size="sm" className="gap-2" onClick={onCreateWeapon}>
        <Plus className="size-4" aria-hidden="true" />
        New Weapon
      </Button>
    </div>
  );
}
