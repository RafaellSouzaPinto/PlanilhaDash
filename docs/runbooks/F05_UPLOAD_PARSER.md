# F05 — Upload e Parsing de Planilha

**Página:** `(app)/upload/page.tsx`
**Componentes:** `Dropzone.tsx`, `FilePreview.tsx`
**Testes:** [T05_UPLOAD_PARSER.md](../testes/T05_UPLOAD_PARSER.md)

---

## Fluxo

```
Dropzone (react-dropzone)
  │  onDrop(files[0])
  │  Validar extensão: .csv | .xlsx | .ods
  │  Validar tamanho: <= MAX_FILE_SIZE_MB (10MB)
  ▼
FilePreview exibe: nome + tamanho + tipo
  │
  ▼ [Gerar Dashboard]
parseFile(file)           ← client-side, no browser
  │  .csv  → parseCsv()  — PapaParse
  │  .xlsx → parseXlsx() — SheetJS
  │  .ods  → parseXlsx() — SheetJS (mesmo fluxo)
  ▼
rows: Record<string, unknown>[]
  │
  ▼
inferTypes(rows) → ColumnMeta[]
  │
  ▼
chartEngine(columnsMeta) → ChartConfig[]   ← ver F09
  │
  ▼
Renderizar ChartGrid + disparar F06 (análise IA, se configurada)
```

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/app/(app)/upload/page.tsx` | Página de upload |
| `src/components/upload/Dropzone.tsx` | Dropzone react-dropzone |
| `src/components/upload/FilePreview.tsx` | Preview do arquivo |
| `src/lib/parser/index.ts` | Entry point do parser |
| `src/lib/parser/xlsxParser.ts` | SheetJS |
| `src/lib/parser/csvParser.ts` | PapaParse |
| `src/lib/inferTypes.ts` | Inferência de tipo por coluna |
| `src/types/spreadsheet.ts` | Tipos `ColumnMeta`, `ColumnType` |

---

## Código — Parser Entry Point

```ts
// src/lib/parser/index.ts
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB ?? 10);

export async function parseFile(file: File): Promise<Record<string, unknown>[]> {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Arquivo muito grande. Máximo: ${MAX_FILE_SIZE_MB}MB`);
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "csv":          return parseCsv(file);
    case "xlsx":
    case "ods":          return parseXlsx(file);
    default: throw new Error(`Formato não suportado: .${ext}`);
  }
}
```

## Código — XLSX Parser

```ts
// src/lib/parser/xlsxParser.ts
import * as XLSX from "xlsx";

export async function parseXlsx(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0]; // MVP: apenas primeira sheet
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}
```

## Código — CSV Parser

```ts
// src/lib/parser/csvParser.ts
import Papa from "papaparse";

export function parseCsv(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header:         true,
      dynamicTyping:  true,
      skipEmptyLines: true,
      complete: (r) => resolve(r.data as Record<string, unknown>[]),
      error:    (e) => reject(new Error(e.message)),
    });
  });
}
```

## Código — Inferência de Tipos

```ts
// src/lib/inferTypes.ts
const CURRENCY_SYMBOLS = /[R$€£¥]/;
const SAMPLE_SIZE = 100;

export function inferTypes(rows: Record<string, unknown>[]): ColumnMeta[] {
  if (rows.length === 0) return [];
  const columns = Object.keys(rows[0]);

  return columns.map((name) => {
    const values = rows.map(r => r[name])
      .filter(v => v !== null && v !== undefined && v !== "")
      .slice(0, SAMPLE_SIZE);

    const total = values.length;
    if (total === 0) return { name, type: "text", stats: { uniqueCount: 0, sampleValues: [] } };

    const strs = values.map(String);
    let type: ColumnType = "text";

    if (strs.filter(v => CURRENCY_SYMBOLS.test(v)).length / total >= 0.8)     type = "currency";
    else if (strs.filter(v => v.endsWith("%")).length / total >= 0.8)          type = "percentage";
    else if (strs.filter(v => isDate(v)).length / total >= 0.8)                type = "date";
    else if (values.filter(v => !isNaN(Number(v))).length / total >= 0.8)      type = "number";
    else if (new Set(values).size / total < 0.2)                               type = "categorical";

    const uniqueCount = new Set(values).size;
    return {
      name, type,
      stats: {
        min: (type === "number" || type === "currency") ? Math.min(...(values as number[])) : undefined,
        max: (type === "number" || type === "currency") ? Math.max(...(values as number[])) : undefined,
        uniqueCount,
        sampleValues: values.slice(0, 5),
      },
    };
  });
}
```

---

## Regras de negócio

1. Parsing acontece **no browser** (client-side) — sem envio do arquivo raw para parsing no servidor
2. Arquivo físico **é enviado ao servidor** para armazenamento em `uploads/{userId}/{timestamp}-{fileName}`
3. Apenas a **primeira sheet** é processada no MVP
4. Limite: `MAX_FILE_SIZE_MB` (padrão 10MB) — validar no cliente antes do upload
5. Inferência analisa no máximo **100 valores por coluna**
