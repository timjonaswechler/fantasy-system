"use client";

import * as React from "react";
import { Upload, Loader, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { importWeapons } from "@/actions/weapons-import";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ImportWeaponsDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  onSuccess?: () => void;
}

export function ImportWeaponsDialog({
  onSuccess,
  ...props
}: ImportWeaponsDialogProps) {
  const [isImporting, setIsImporting] = React.useState(false);
  const [importStatus, setImportStatus] = React.useState<{
    status: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({ status: "idle" });
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const resetState = () => {
    setSelectedFile(null);
    setImportStatus({ status: "idle" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setImportStatus({ status: "idle" });
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      setIsImporting(true);
      setImportStatus({ status: "loading", message: "Importing weapons..." });

      // Read the file
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        const fileContent = e.target?.result as string;

        // Call the server action
        const result = await importWeapons(fileContent);

        if (result.success) {
          setImportStatus({
            status: "success",
            message: result.message,
          });
          // Call onSuccess after a delay to allow the user to see the success message
          setTimeout(() => {
            props.onOpenChange?.(false);
            onSuccess?.();
            resetState();
          }, 1500);
        } else {
          setImportStatus({
            status: "error",
            message: result.message || "Failed to import weapons",
          });
        }
      };

      fileReader.onerror = () => {
        setImportStatus({
          status: "error",
          message: "Failed to read file",
        });
      };

      fileReader.readAsText(selectedFile);
    } catch (error) {
      console.error("Error importing weapons:", error);
      setImportStatus({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const DialogComponent = isDesktop ? Dialog : Drawer;
  const DialogContentComponent = isDesktop ? DialogContent : DrawerContent;
  const DialogTriggerComponent = isDesktop ? DialogTrigger : DrawerTrigger;
  const DialogCloseComponent = isDesktop ? DialogClose : DrawerClose;
  const DialogHeaderComponent = isDesktop ? DialogHeader : DrawerHeader;
  const DialogFooterComponent = isDesktop ? DialogFooter : DrawerFooter;
  const DialogTitleComponent = isDesktop ? DialogTitle : DrawerTitle;
  const DialogDescriptionComponent = isDesktop
    ? DialogDescription
    : DrawerDescription;

  return (
    <DialogComponent
      {...props}
      onOpenChange={(open) => {
        if (!open) {
          resetState();
        }
        props.onOpenChange?.(open);
      }}
    >
      <DialogTriggerComponent asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="size-4" aria-hidden="true" />
          Import
        </Button>
      </DialogTriggerComponent>
      <DialogContentComponent>
        <DialogHeaderComponent>
          <DialogTitleComponent>Import Weapons</DialogTitleComponent>
          <DialogDescriptionComponent>
            Upload a JSON file to import weapons into the database. The JSON
            file should contain an array of weapon objects.
          </DialogDescriptionComponent>
        </DialogHeaderComponent>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="file-upload" className="text-sm font-medium">
              JSON File
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="cursor-pointer file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
            <p className="text-xs text-muted-foreground">
              Only JSON files are accepted. Make sure your data is properly
              formatted.
            </p>
          </div>

          {selectedFile && (
            <div className="rounded-md border border-border p-4">
              <p className="font-medium">Selected file:</p>
              <p className="text-sm">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          {importStatus.status !== "idle" && (
            <Alert
              className={cn({
                "border-yellow-600 text-yellow-600":
                  importStatus.status === "loading",
                "border-destructive text-destructive":
                  importStatus.status === "error",
                "border-green-600 text-green-600":
                  importStatus.status === "success",
              })}
            >
              {importStatus.status === "loading" && (
                <Loader className="h-4 w-4 animate-spin" />
              )}
              {importStatus.status === "error" && (
                <AlertTriangle className="h-4 w-4" />
              )}
              {importStatus.status === "success" && (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertTitle>
                {importStatus.status === "loading" && "Importing..."}
                {importStatus.status === "error" && "Import Failed"}
                {importStatus.status === "success" && "Import Successful"}
              </AlertTitle>
              <AlertDescription>{importStatus.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooterComponent className="gap-2 sm:space-x-0">
          <DialogCloseComponent asChild>
            <Button variant="outline">Cancel</Button>
          </DialogCloseComponent>
          <Button
            onClick={handleImport}
            disabled={
              !selectedFile || isImporting || importStatus.status === "success"
            }
          >
            {isImporting && (
              <Loader
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Import
          </Button>
        </DialogFooterComponent>
      </DialogContentComponent>
    </DialogComponent>
  );
}
