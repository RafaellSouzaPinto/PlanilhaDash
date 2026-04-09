import type { ColumnMeta, ColumnType } from "@/types/spreadsheet";

const CURRENCY_SYMBOLS = /[R$€£¥]/;
const SAMPLE_SIZE = 100;

// Date patterns: ISO (2024-01-15), BR (15/01/2024), US (01/15/2024)
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/, // ISO
  /^\d{2}\/\d{2}\/\d{4}$/,              // BR or US
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,        // Short dates
];

function isDate(value: string): boolean {
  if (value instanceof Date) return true;
  const str = String(value).trim();
  const matchesPattern = DATE_PATTERNS.some((pattern) => pattern.test(str));
  if (!matchesPattern) return false;
  // Validate it's actually a parseable date
  const parsed = new Date(str.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1"));
  return !isNaN(parsed.getTime());
}

export function inferTypes(rows: Record<string, unknown>[]): ColumnMeta[] {
  if (rows.length === 0) return [];

  const columns = Object.keys(rows[0]);

  return columns.map((name) => {
    const rawValues = rows
      .map((r) => r[name])
      .filter((v) => v !== null && v !== undefined && v !== "")
      .slice(0, SAMPLE_SIZE);

    const total = rawValues.length;

    if (total === 0) {
      return {
        name,
        type: "text" as ColumnType,
        stats: { uniqueCount: 0, sampleValues: [] },
      };
    }

    const strs = rawValues.map((v) => {
      if (v instanceof Date) return v.toISOString();
      return String(v);
    });

    let type: ColumnType = "text";

    if (strs.filter((v) => CURRENCY_SYMBOLS.test(v)).length / total >= 0.8) {
      type = "currency";
    } else if (strs.filter((v) => v.trim().endsWith("%")).length / total >= 0.8) {
      type = "percentage";
    } else if (
      rawValues.filter((v) => v instanceof Date).length / total >= 0.8 ||
      strs.filter((v) => isDate(v)).length / total >= 0.8
    ) {
      type = "date";
    } else if (
      rawValues.filter((v) => !isNaN(Number(v))).length / total >= 0.8
    ) {
      type = "number";
    } else if (new Set(rawValues).size / total < 0.2) {
      type = "categorical";
    }

    const uniqueCount = new Set(rawValues).size;
    const numericValues =
      type === "number" || type === "currency"
        ? (rawValues.filter((v) => !isNaN(Number(v))) as number[]).map(Number)
        : [];

    return {
      name,
      type,
      stats: {
        min: numericValues.length > 0 ? Math.min(...numericValues) : undefined,
        max: numericValues.length > 0 ? Math.max(...numericValues) : undefined,
        uniqueCount,
        sampleValues: rawValues.slice(0, 5),
      },
    };
  });
}
