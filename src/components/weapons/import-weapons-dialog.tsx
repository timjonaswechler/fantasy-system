// src/components/weapons/import-weapons-dialog.tsx
"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FileUploadDialog } from "@/components/ui/file-upload-dialog";
import { importWeapons } from "@/actions/weapons-import";

interface ImportWeaponsDialogProps {
  onSuccess?: () => void;
}

export function ImportWeaponsDialog({ onSuccess }: ImportWeaponsDialogProps) {
  // Reference to the FileUploadDialog to reset it
  const dialogRef = useRef<{ reset: () => void } | null>(null);
  const [open, setOpen] = useState(false);

  // Handle file import
  const handleFilesConfirmed = async (files: File[]) => {
    if (!files.length) {
      toast.error("Please select at least one file");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading(
      `Importing ${files.length} weapon${files.length > 1 ? "s" : ""}...`
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

          // Import weapons
          const result = await importWeapons(fileContent);

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
          `${successCount} weapon${
            successCount > 1 ? "s" : ""
          } successfully imported`
        );

        // Clear the file list by closing the dialog
        setOpen(false);

        if (onSuccess) {
          // Give the database a moment to process before refreshing
          setTimeout(onSuccess, 500);
        }
      } else if (successCount > 0) {
        toast.warning(
          `${successCount} weapon${
            successCount > 1 ? "s" : ""
          } imported, ${errorCount} failed`
        );

        // Clear the file list by closing the dialog
        setOpen(false);

        if (onSuccess) {
          setTimeout(onSuccess, 500);
        }
      } else {
        toast.error(`Import failed: ${errorMessages[0] || "Unknown error"}`);
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show error toast
      toast.error(
        `Import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Helper function to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = (e) => resolve(e.target?.result as string);
      fileReader.onerror = () => reject(new Error("Error reading file"));
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
      buttonText="Import"
      dialogTitle="Upload Files"
      dialogDescription="Select JSON files with weapon data to import"
      onConfirm={handleFilesConfirmed}
      open={open}
      onOpenChange={setOpen}
    />
  );
}
