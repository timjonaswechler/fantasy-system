"use client";

import { useState } from "react";
import { FileUploadDialog } from "@/components/ui/file-upload-dialog";

export default function FileUploadExample() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFilesConfirmed = (files: File[]) => {
    setUploadedFiles(files);

    // Hier kannst du mit den Dateien arbeiten:
    // - In eine Datenbank speichern
    // - Zur weiteren Verarbeitung verwenden
    // - Analysieren, usw.

    console.log("Dateien bestätigt:", files);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Datei-Upload Beispiel</h1>

      <FileUploadDialog
        maxSize={5 * 1024 * 1024} // 5MB
        maxFileCount={10} // Unbegrenzt
        multiple={true}
        accept={{
          "plain/text": [".tsx"],
          //pdf
          "application/pdf": [".pdf"],
        }}
        buttonText="Dateien auswählen"
        dialogTitle="Dateien hochladen"
        dialogDescription="Wähle PDF oder Excel-Dateien zum Importieren"
        onConfirm={handleFilesConfirmed}
      />
    </div>
  );
}
