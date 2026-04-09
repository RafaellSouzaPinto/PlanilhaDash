"use client";

import { useMemo } from "react";

interface DataTableProps {
  data: Record<string, unknown>[];
}

export function DataTable({ data }: DataTableProps) {
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-8">
        Sem dados para exibir
      </p>
    );
  }

  return (
    <div className="overflow-auto max-h-80">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th
                key={col}
                className="text-left font-medium text-muted-foreground py-2 px-3 whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
              {columns.map((col) => (
                <td key={col} className="py-2 px-3 whitespace-nowrap">
                  {String(row[col] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
