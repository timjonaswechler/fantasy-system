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
}: FileUploadDialogProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [open, setOpen] = React.useState(false);

  const handleConfirm = () => {
    if (onConfirm && files.length > 0) {
      onConfirm(files);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setFiles([]);
    setOpen(false);
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

          {files.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 font-medium">
                Ausgewählte Dateien ({files.length})
              </h4>
              <ScrollArea className="h-full max-h-40 w-full rounded-md border">
                <div className="p-4">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center">
                        <div className="ml-2">
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
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
