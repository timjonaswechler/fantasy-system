"use client";

import { IWeapon } from "@/types/weapon";
import type { Table } from "@tanstack/react-table";
import { Download, Plus, FileUp } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { exportTableToCSV } from "@/lib/export";

import { DeleteWeaponDialog } from "./delete-weapons-dialog";

interface WeaponsTableToolbarActionsProps {
  table: Table<IWeapon>;
}

export function WeaponsTableToolbarActions({
  table,
}: WeaponsTableToolbarActionsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      {table.getFilteredSelectedRowModel().rows.length > 0 ? (
        <DeleteWeaponDialog
          id="batch-delete-weapons-trigger"
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
            filename: "waffenliste",
            excludeColumns: ["select", "actions"],
          })
        }
        className="gap-2"
      >
        <Download className="size-4" aria-hidden="true" />
        Export
      </Button>

      <Button
        variant="default"
        size="sm"
        className="gap-2"
        onClick={() => router.push("/weapons/new")}
      >
        <Plus className="size-4" aria-hidden="true" />
        Neue Waffe
      </Button>
    </div>
  );
}
