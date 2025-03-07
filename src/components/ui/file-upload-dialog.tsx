// src/components/ui/file-upload-dialog.tsx
"use client";

import * as React from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUploader } from "@/components/ui/file-uploader";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileUploadDialogProps {
  /**
   * Maximum file size for the uploader.
   * @default 1024 * 1024 * 2 // 2MB
   */
  maxSize?: number;

  /**
   * Maximum number of files for the uploader.
   * @default 1
   */
  maxFileCount?: number;

  /**
   * Accepted file types for the uploader.
   * @default { "image/*": [] }
   */
  accept?: Record<string, string[]>;

  /**
   * Whether the uploader should accept multiple files.
   * @default false
   */
  multiple?: boolean;

  /**
   * Button text
   * @default "Upload Files"
   */
  buttonText?: string;

  /**
   * Dialog title
   * @default "Upload Files"
   */
  dialogTitle?: string;

  /**
   * Dialog description
   * @default "Drag and drop files here or click to select files"
   */
  dialogDescription?: string;

  /**
   * Function to be called when files are confirmed.
   * @param files The selected files
   */
  onConfirm?: (files: File[]) => void;

  /**
   * Controlled open state
   */
  open?: boolean;

  /**
   * Function to be called when open state changes
   */
  onOpenChange?: (open: boolean) => void;
}

export function FileUploadDialog({
  maxSize = 1024 * 1024 * 2,
  maxFileCount = 1,
  accept = { "image/*": [] },
  multiple = false,
  buttonText = "Dateien hochladen",
  dialogTitle = "Dateien hochladen",
  dialogDescription = "Ziehe Dateien hierher oder klicke, um Dateien auszuwählen",
  onConfirm,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: FileUploadDialogProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [internalOpen, setInternalOpen] = React.useState(false);

  // Determine if the component is controlled or uncontrolled
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  // Reset files when dialog is closed
  React.useEffect(() => {
    if (!open) {
      setFiles([]);
    }
  }, [open]);

  const handleConfirm = () => {
    if (onConfirm && files.length > 0) {
      onConfirm(files);
    }
    // We don't close the dialog here anymore,
    // as the parent component will handle it after processing
  };

  const handleCancel = () => {
    setFiles([]);
    setOpen?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 size-4" aria-hidden="true" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <FileUploader
            value={files}
            onValueChange={setFiles}
            maxSize={maxSize}
            maxFileCount={maxFileCount}
            accept={accept}
            multiple={multiple}
          />
        </div>
        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={handleCancel}>
            Abbrechen
          </Button>
          <Button onClick={handleConfirm} disabled={files.length === 0}>
            Bestätigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
