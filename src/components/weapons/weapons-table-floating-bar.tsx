"use client";

import { IWeapon, WeaponType } from "@/types/weapon";
import type { Table } from "@tanstack/react-table";
import {
  X,
  Download,
  Trash2,
  ArrowUp,
  CheckCircle2,
  Loader,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Kbd } from "@/components/kbd";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/ui/portal";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { exportTableToCSV } from "@/lib/export";

interface WeaponsTableFloatingBarProps {
  table: Table<IWeapon>;
}

export function WeaponsTableFloatingBar({
  table,
}: WeaponsTableFloatingBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [action, setAction] = React.useState<"export" | "delete">();

  // Clear selection on Escape key press
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        table.toggleAllRowsSelected(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [table]);

  const handleExport = () => {
    setAction("export");

    startTransition(() => {
      try {
        exportTableToCSV(table, {
          excludeColumns: ["select", "actions"],
          onlySelected: true,
          filename: "waffenliste",
        });
        toast.success("Waffen exportiert");
      } catch (error) {
        console.error("Fehler beim Exportieren:", error);
        toast.error("Fehler beim Exportieren der Waffen");
      }
    });
  };

  const handleDeleteOpen = () => {
    // This will be implemented to open a deletion dialog
    // The actual deletion logic is in the dialog component
    document.getElementById("batch-delete-weapons-trigger")?.click();
  };

  return (
    <Portal>
      <div className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit px-2.5">
        <div className="w-full overflow-x-auto">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-md border bg-background p-2 text-foreground shadow">
            <div className="flex h-7 items-center rounded-md border border-dashed pr-1 pl-2.5">
              <span className="whitespace-nowrap text-xs">
                {rows.length} ausgewählt
              </span>
              <Separator orientation="vertical" className="mr-1 ml-2" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 hover:border"
                    onClick={() => table.toggleAllRowsSelected(false)}
                  >
                    <X className="size-3.5 shrink-0" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="flex items-center border bg-accent px-2 py-1 font-semibold text-foreground dark:bg-zinc-900">
                  <p className="mr-2">Auswahl aufheben</p>
                  <Kbd abbrTitle="Escape" variant="outline">
                    Esc
                  </Kbd>
                </TooltipContent>
              </Tooltip>
            </div>
            <Separator orientation="vertical" className="hidden h-5 sm:block" />
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-7 border"
                    onClick={handleExport}
                    disabled={isPending}
                  >
                    {isPending && action === "export" ? (
                      <Loader
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Download className="size-3.5" aria-hidden="true" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                  <p>Waffen exportieren</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-7 border"
                    onClick={handleDeleteOpen}
                    disabled={isPending}
                    aria-label="Ausgewählte Waffen löschen"
                  >
                    {isPending && action === "delete" ? (
                      <Loader
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                  <p>Waffen löschen</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
