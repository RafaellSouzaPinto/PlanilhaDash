"use client";

import { ChartCard } from "@/components/dashboard/ChartCard";
import type { ChartConfig } from "@/types/spreadsheet";

interface ChartGridProps {
  configs: ChartConfig[];
  id?: string;
}

export function ChartGrid({ configs, id }: ChartGridProps) {
  if (configs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum gráfico gerado. Tente outra planilha.
      </div>
    );
  }

  return (
    <div
      id={id}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white"
    >
      {configs.map((config, i) => (
        <ChartCard key={i} config={config} />
      ))}
    </div>
  );
}
