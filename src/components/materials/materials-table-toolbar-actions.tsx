// src/components/materials/materials-table-toolbar-actions.tsx
"use client";
import { useState } from "react";

import { IMaterial } from "@/types/material";
import type { Table } from "@tanstack/react-table";
import { Download, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { exportMaterialsAsJSON } from "@/actions/materials-export";

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
  const [isExporting, setIsExporting] = useState(false);

  // Handle file import success
  const handleImportSuccess = () => {
    if (onImportSuccess) {
      onImportSuccess();
    }
  };

  // Server-seitiger Export der Materialien
  const handleServerExport = async () => {
    if (!hasSelectedRows) return;

    setIsExporting(true);
    try {
      // IDs der ausgewählten Materialien sammeln
      const materialIds = selectedRows.map((row) => row.original.id);

      // Server Action aufrufen
      const result = await exportMaterialsAsJSON(materialIds);

      // Download der Datei initiieren
      const blob = new Blob([result.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();

      // Aufräumen
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(
        `${selectedRows.length} Material(ien) erfolgreich exportiert`
      );
    } catch (error) {
      console.error("Fehler beim Exportieren:", error);
      toast.error(
        "Export fehlgeschlagen: " +
          (error instanceof Error ? error.message : "Unbekannter Fehler")
      );
    } finally {
      setIsExporting(false);
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
            onClick={handleServerExport}
            className="gap-2"
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
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
