"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, LineChart, PieChart, AlignLeft, Table2, Sparkles } from "lucide-react";
import type { ChartSuggestion, ChartType } from "@/types/spreadsheet";

interface ChartSuggestionSelectorProps {
  suggestions: ChartSuggestion[];
  onConfirm: (selected: ChartSuggestion[]) => void;
  loading: boolean;
}

const MAX_SELECTION = 4;

const CHART_ICONS: Record<ChartType, React.ReactNode> = {
  bar: <BarChart2 className="h-5 w-5" />,
  line: <LineChart className="h-5 w-5" />,
  pie: <PieChart className="h-5 w-5" />,
  barHorizontal: <AlignLeft className="h-5 w-5" />,
  table: <Table2 className="h-5 w-5" />,
};

const CHART_LABELS: Record<ChartType, string> = {
  bar: "Barras",
  line: "Linha",
  pie: "Pizza",
  barHorizontal: "Barras Horiz.",
  table: "Tabela",
};

function suggestionKey(s: ChartSuggestion): string {
  return `${s.type}:${s.xKey}:${s.yKey ?? ""}`;
}

export function ChartSuggestionSelector({
  suggestions,
  onConfirm,
  loading,
}: ChartSuggestionSelectorProps) {
  const [selected, setSelected] = useState<ChartSuggestion[]>([]);

  function handleToggle(suggestion: ChartSuggestion) {
    const key = suggestionKey(suggestion);
    setSelected((prev) => {
      const isSelected = prev.some((s) => suggestionKey(s) === key);
      if (isSelected) {
        return prev.filter((s) => suggestionKey(s) !== key);
      }
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, suggestion];
    });
  }

  function handleConfirm() {
    if (selected.length === 0) return;
    onConfirm(selected);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          Sugestões da IA
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione até 4 gráficos para seu dashboard
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              data-testid="suggestion-skeleton"
              className="rounded-lg border p-4 space-y-2"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((suggestion, index) => {
            const key = suggestionKey(suggestion);
            const isSelected = selected.some((s) => suggestionKey(s) === key);
            const isDisabled = !isSelected && selected.length >= MAX_SELECTION;

            return (
              <div
                key={key}
                data-testid={`suggestion-card-${index}`}
                onClick={() => !isDisabled && handleToggle(suggestion)}
                className={[
                  "relative rounded-lg border p-4 cursor-pointer transition-all",
                  isSelected
                    ? "ring-2 ring-primary border-primary bg-primary/5"
                    : "hover:border-muted-foreground/50",
                  isDisabled ? "opacity-50 cursor-not-allowed" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="absolute top-3 right-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => handleToggle(suggestion)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Selecionar ${suggestion.title}`}
                    className="h-4 w-4 accent-primary"
                    data-testid={`checkbox-${index}`}
                  />
                </div>

                <div className="flex items-start gap-3 pr-6">
                  <div className="text-muted-foreground mt-0.5">
                    {CHART_ICONS[suggestion.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight">
                      {suggestion.title}
                    </p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {CHART_LABELS[suggestion.type]}
                    </Badge>
                    {suggestion.rationale && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {suggestion.rationale}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted-foreground">
          {selected.length} de {MAX_SELECTION} selecionados
        </p>
        <Button
          onClick={handleConfirm}
          disabled={selected.length === 0}
        >
          Gerar dashboard com seleção
        </Button>
      </div>
    </div>
  );
}
