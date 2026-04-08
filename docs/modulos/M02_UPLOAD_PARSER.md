# M02 — Upload, Parser e Configuração de IA

**Status:** 🚧 Em desenvolvimento

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/app/(app)/upload/page.tsx` | Página de upload |
| `src/components/upload/Dropzone.tsx` | Dropzone react-dropzone |
| `src/components/upload/FilePreview.tsx` | Preview do arquivo selecionado |
| `src/components/modals/ApiKeyModal.tsx` | Modal de configuração de IA |
| `src/lib/parser/index.ts` | Entry point — detecta formato e delega |
| `src/lib/parser/xlsxParser.ts` | Parsing de XLSX/ODS via SheetJS |
| `src/lib/parser/csvParser.ts` | Parsing de CSV via PapaParse |
| `src/lib/inferTypes.ts` | Inferência de tipo por coluna |
| `src/app/api/user/api-key/route.ts` | GET/POST API Key de IA |

---

## Parser Entry Point (`src/lib/parser/index.ts`)

```ts
import { parseXlsx } from "./xlsxParser";
import { parseCsv } from "./csvParser";

const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB ?? 10);

export async function parseFile(file: File): Promise<Record<string, unknown>[]> {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Arquivo muito grande. Máximo: ${MAX_FILE_SIZE_MB}MB`);
  }

  const ext = file.name.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "csv":  return parseCsv(file);
    case "xlsx":
    case "ods":  return parseXlsx(file);
    default:     throw new Error(`Formato não suportado: .${ext}`);
  }
}
```

---

## XLSX Parser (`src/lib/parser/xlsxParser.ts`)

```ts
import * as XLSX from "xlsx";

export async function parseXlsx(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  // MVP: apenas a primeira sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}
```

---

## CSV Parser (`src/lib/parser/csvParser.ts`)

```ts
import Papa from "papaparse";

export function parseCsv(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header:        true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as Record<string, unknown>[]),
      error:    (err)     => reject(new Error(err.message)),
    });
  });
}
```

---

## Inferência de Tipos (`src/lib/inferTypes.ts`)

```ts
import type { ColumnMeta, ColumnType } from "@/types/spreadsheet";

const CURRENCY_SYMBOLS = /[R$€£¥]/;
const SAMPLE_SIZE = 100;

export function inferTypes(rows: Record<string, unknown>[]): ColumnMeta[] {
  if (rows.length === 0) return [];

  const columns = Object.keys(rows[0]);

  return columns.map((name) => {
    const values = rows
      .map(r => r[name])
      .filter(v => v !== null && v !== undefined && v !== "")
      .slice(0, SAMPLE_SIZE);

    const total = values.length;
    if (total === 0) return makeColumn(name, "text", []);

    const type = detectType(values, total);
    const uniqueCount = new Set(values).size;

    return {
      name,
      type,
      stats: {
        min: type === "number" || type === "currency"
          ? Math.min(...(values as number[]))
          : undefined,
        max: type === "number" || type === "currency"
          ? Math.max(...(values as number[]))
          : undefined,
        uniqueCount,
        sampleValues: values.slice(0, 5),
      },
    };
  });
}

function detectType(values: unknown[], total: number): ColumnType {
  const strs = values.map(String);

  if (strs.filter(v => CURRENCY_SYMBOLS.test(v)).length / total >= 0.8) return "currency";
  if (strs.filter(v => v.endsWith("%")).length / total >= 0.8)           return "percentage";
  if (strs.filter(v => isDate(v)).length / total >= 0.8)                 return "date";
  if (values.filter(v => typeof v === "number" || !isNaN(Number(v))).length / total >= 0.8)
    return "number";
  if (new Set(values).size / total < 0.2)                                return "categorical";
  return "text";
}

function isDate(value: string): boolean {
  return !isNaN(Date.parse(value)) && /\d{2,4}[-/]\d{1,2}[-/]\d{1,4}|\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value);
}

function makeColumn(name: string, type: ColumnType, values: unknown[]): ColumnMeta {
  return { name, type, stats: { uniqueCount: 0, sampleValues: values } };
}
```

---

## Modal de API Key (`components/modals/ApiKeyModal.tsx`)

### Comportamento
- Aparece automaticamente se `hasApiKey === false` na primeira carga do `(app)/layout.tsx`
- Pode ser ignorado (usuário usa sem IA)
- Disponível também via configurações

### Regras
- Input do tipo `password` para a API Key
- Exibir aviso: "Sua chave é criptografada e nunca será exibida novamente"
- Após salvar, não exibir novamente na mesma sessão
- Em caso de erro na API, mostrar mensagem clara sem expor detalhes técnicos

---

## Testes relacionados

Ver [../testes/T02_PARSER.md](../testes/T02_PARSER.md)
