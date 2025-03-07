// src/components/materials/import-materials-dialog.tsx
"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileUploadDialog } from "@/components/ui/file-upload-dialog";
import { importMaterials } from "@/actions/materials-import";

interface ImportMaterialsDialogProps {
  onSuccess?: () => void;
}

export function ImportMaterialsDialog({
  onSuccess,
}: ImportMaterialsDialogProps) {
  // Reference to the FileUploadDialog to reset it
  const dialogRef = useRef<{ reset: () => void } | null>(null);
  const [open, setOpen] = useState(false);

  // Handle file import
  const handleFilesConfirmed = async (files: File[]) => {
    if (!files.length) {
      toast.error("Bitte wähle mindestens eine Datei aus");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading(
      `Importiere ${files.length} Material${files.length > 1 ? "ien" : ""}...`
    );

    try {
      let successCount = 0;
      let errorCount = 0;
      let errorMessages: string[] = [];

      // Process each file
      for (const file of files) {
        try {
          // Read file content
          const fileContent = await readFileAsText(file);

          // Import materials
          const result = await importMaterials(fileContent);

          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            errorMessages.push(`${file.name}: ${result.message}`);
          }
        } catch (error) {
          errorCount++;
          errorMessages.push(
            `${file.name}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show appropriate toast based on results
      if (successCount > 0 && errorCount === 0) {
        toast.success(
          `${successCount} Material${
            successCount > 1 ? "ien" : ""
          } erfolgreich importiert`
        );

        // Clear the file list by closing the dialog
        setOpen(false);

        if (onSuccess) {
          // Give the database a moment to process before refreshing
          setTimeout(onSuccess, 500);
        }
      } else if (successCount > 0) {
        toast.warning(
          `${successCount} Material${
            successCount > 1 ? "ien" : ""
          } importiert, ${errorCount} fehlgeschlagen`
        );

        // Clear the file list by closing the dialog
        setOpen(false);

        if (onSuccess) {
          setTimeout(onSuccess, 500);
        }
      } else {
        toast.error(
          `Import fehlgeschlagen: ${errorMessages[0] || "Unbekannter Fehler"}`
        );
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show error toast
      toast.error(
        `Import fehlgeschlagen: ${
          error instanceof Error ? error.message : "Unbekannter Fehler"
        }`
      );
    }
  };

  // Helper function to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = (e) => resolve(e.target?.result as string);
      fileReader.onerror = () =>
        reject(new Error("Fehler beim Lesen der Datei"));
      fileReader.readAsText(file);
    });
  };

  return (
    <FileUploadDialog
      maxSize={5 * 1024 * 1024} // 5MB
      maxFileCount={10}
      multiple={true}
      accept={{
        "application/json": [".json"],
      }}
      buttonText="Importieren"
      dialogTitle="Dateien hochladen"
      dialogDescription="Wähle JSON-Dateien mit Materialdaten zum Importieren"
      onConfirm={handleFilesConfirmed}
      open={open}
      onOpenChange={setOpen}
    />
  );
}
