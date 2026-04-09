export type ColumnType =
  | "number"
  | "currency"
  | "percentage"
  | "date"
  | "categorical"
  | "text";

export type ChartType = "line" | "bar" | "pie" | "barHorizontal" | "table";

export interface ColumnStats {
  min?: number;
  max?: number;
  uniqueCount: number;
  sampleValues: unknown[];
}

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  stats: ColumnStats;
}

export interface ChartConfig {
  type: ChartType;
  xKey: string;
  yKey?: string;
  title: string;
  data: Record<string, unknown>[];
}
