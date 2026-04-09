"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = {
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
};

const MAX_SIZE_MB = 10;

interface DropzoneProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
}

export function Dropzone({ onFileAccepted, disabled }: DropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_TYPES,
      maxSize: MAX_SIZE_MB * 1024 * 1024,
      maxFiles: 1,
      disabled,
    });

  const rejectionError = fileRejections[0]?.errors[0];

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {isDragActive ? (
            <Upload className="h-12 w-12 text-primary animate-bounce" />
          ) : (
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
          )}
          <div>
            <p className="text-lg font-medium">
              {isDragActive
                ? "Solte o arquivo aqui"
                : "Arraste sua planilha ou clique para selecionar"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              CSV, XLSX ou ODS — máximo {MAX_SIZE_MB}MB
            </p>
          </div>
        </div>
      </div>

      {rejectionError && (
        <p className="text-sm text-destructive">
          {rejectionError.code === "file-too-large"
            ? `Arquivo muito grande. Máximo: ${MAX_SIZE_MB}MB`
            : rejectionError.code === "file-invalid-type"
              ? "Formato não suportado. Use CSV, XLSX ou ODS."
              : rejectionError.message}
        </p>
      )}
    </div>
  );
}
