"use client";

import { FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/lib/utils";

interface FilePreviewProps {
  file: File;
  rowCount?: number;
  onRemove: () => void;
}

export function FilePreview({ file, rowCount, onRemove }: FilePreviewProps) {
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
      <FileSpreadsheet className="h-8 w-8 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{file.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-muted-foreground">
            {formatFileSize(file.size)}
          </span>
          <Badge variant="secondary">{ext}</Badge>
          {rowCount !== undefined && (
            <Badge variant="outline">{rowCount.toLocaleString("pt-BR")} linhas</Badge>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label="Remover arquivo"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
