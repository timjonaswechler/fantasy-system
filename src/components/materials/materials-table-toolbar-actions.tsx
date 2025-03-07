// src/components/materials/materials-table-toolbar-actions.tsx
"use client";
import { useState, useRef } from "react";

import { IMaterial } from "@/types/material";
import type { Table } from "@tanstack/react-table";
import { Download, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";

import { Button } from "@/components/ui/button";
import { exportTableToJSON } from "@/lib/export";

import { DeleteMaterialsDialog } from "./delete-materials-dialog";
import { FileUploadDialog } from "@/components/ui/file-upload-dialog";

// Diese Funktion sollte in der entsprechenden Server-Action-Datei implementiert werden
import { importMaterials } from "@/actions/materials-import";

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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const [importStatus, setImportStatus] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ status: "idle" });
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelectedRows = selectedRows.length > 0;

  const handleFilesConfirmed = async (files: File[]) => {
    if (!files.length) {
      toast.error("Bitte wähle mindestens eine Datei aus");
      return;
    }

    setUploadedFiles(files);
    setImportStatus({
      status: "loading",
      message: `Importiere ${files.length} Material${
        files.length > 1 ? "ien" : ""
      }...`,
    });

    try {
      let successCount = 0;
      let errorCount = 0;
      let errorMessages = [];

      // Iteriere über alle Dateien und importiere sie nacheinander
      for (const file of files) {
        try {
          // Datei lesen
          const fileContent = await readFileAsText(file);

          // Server-Action aufrufen
          const result = await importMaterials(fileContent);

          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            const errorMsg = `Fehler beim Importieren von ${file.name}: ${result.message}`;
            console.error(errorMsg);
            errorMessages.push(errorMsg);
          }
        } catch (error) {
          errorCount++;
          const errorMsg = `Fehler beim Lesen der Datei ${file.name}: ${
            error instanceof Error ? error.message : String(error)
          }`;
          console.error(errorMsg);
          errorMessages.push(errorMsg);
        }
      }

      // Status und Benachrichtigung basierend auf Ergebnissen setzen
      let statusMessage = "";
      let toastType: "success" | "warning" | "error" = "success";

      if (errorCount === 0 && successCount > 0) {
        statusMessage = `${successCount} Material${
          successCount > 1 ? "ien" : ""
        } erfolgreich importiert`;
        toastType = "success";
      } else if (successCount > 0) {
        statusMessage = `${successCount} Material${
          successCount > 1 ? "ien" : ""
        } importiert, ${errorCount} fehlgeschlagen`;
        toastType = "warning";
      } else {
        statusMessage = "Import fehlgeschlagen";
        if (errorMessages.length > 0) {
          // Zeige den ersten Fehler an, um einen Hinweis zu geben
          statusMessage += `: ${errorMessages[0]}`;
        }
        toastType = "error";
      }

      // Setze den Status für die UI-Anzeige
      setImportStatus({
        status: toastType === "error" ? "error" : "success",
        message: statusMessage,
      });

      // Zeige nur EINEN Toast am Ende des Imports
      if (toastType === "success") {
        toast.success(statusMessage);
      } else if (toastType === "warning") {
        toast.warning(statusMessage);
      } else {
        toast.error(statusMessage);
      }

      // Bei erfolgreichem Import aktualisieren
      if (successCount > 0 && onImportSuccess) {
        // Warte kurz, damit der Benutzer die Benachrichtigung sehen kann
        setTimeout(() => {
          onImportSuccess();
        }, 1500);
      }
    } catch (error) {
      // Allgemeiner Fehler bei der Verarbeitung
      console.error("Fehler beim Importieren:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unbekannter Fehler aufgetreten";

      setImportStatus({
        status: "error",
        message: errorMessage,
      });

      toast.error(`Import fehlgeschlagen: ${errorMessage}`);
    }
    window.location.reload();
    // Kein window.location.reload() mehr!
    // Setze stattdessen einen Zustand, der signalisiert, dass der Import abgeschlossen ist
    setIsImporting(false);
  };

  // Hilfsfunktion zum Lesen einer Datei als Text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = (e) => resolve(e.target?.result as string);
      fileReader.onerror = (e) => reject(new Error("Dateilesefehler"));
      fileReader.readAsText(file);
    });
  };

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

      <FileUploadDialog
        maxSize={5 * 1024 * 1024} // 5MB
        maxFileCount={10}
        multiple={true}
        accept={{
          "application/json": [".json"],
        }}
        buttonText="Importieren"
        dialogTitle="Dateien hochladen"
        dialogDescription="Wähle JSON-Dateien zum Importieren"
        onConfirm={handleFilesConfirmed}
      />

      <Button size="sm" className="gap-2" onClick={onCreateMaterial}>
        <Plus className="size-4" aria-hidden="true" />
        Neues Material
      </Button>
    </div>
  );
}
