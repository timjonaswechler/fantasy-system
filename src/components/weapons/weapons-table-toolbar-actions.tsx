"use client";

import { IWeapon } from "@/actions/weapons";
import type { Table } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportTableToCSV } from "@/lib/export";

import { DeleteWeaponsDialog } from "./delete-weapons-dialog";

interface WeaponsTableToolbarActionsProps {
  table: Table<IWeapon>;
  onCreateWeapon?: () => void;
}

export function WeaponsTableToolbarActions({
  table,
  onCreateWeapon,
}: WeaponsTableToolbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {table.getFilteredSelectedRowModel().rows.length > 0 ? (
        <DeleteWeaponsDialog
          weapons={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          onSuccess={() => table.toggleAllRowsSelected(false)}
        />
      ) : null}

      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportTableToCSV(table, {
            filename: "weapons",
            excludeColumns: ["select", "actions"],
          })
        }
        className="gap-2"
      >
        <Download className="size-4" aria-hidden="true" />
        Export
      </Button>

      <Button size="sm" className="gap-2" onClick={onCreateWeapon}>
        <Plus className="size-4" aria-hidden="true" />
        New Weapon
      </Button>
    </div>
  );
}
