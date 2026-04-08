# Skill: TypeScript

**Projeto:** PlanilhaDash
**Versão:** TypeScript 5.x com `strict: true`

---

## Configuração

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

## Tipos compartilhados

Todos em `src/types/spreadsheet.ts`:

```ts
export type ColumnType = "number" | "currency" | "percentage" | "date" | "categorical" | "text";

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  stats: {
    min?: number;
    max?: number;
    uniqueCount: number;
    sampleValues: unknown[];
  };
}

export type ChartType = "bar" | "line" | "pie" | "scatter" | "barHorizontal" | "table";

export interface ChartConfig {
  type:     ChartType;
  xColumn:  string;
  yColumn?: string;
  title:    string;
}
```

---

## Convenções de nomenclatura

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Componentes React | PascalCase | `ChartCard.tsx` |
| Funções utilitárias | camelCase | `inferColumnType()` |
| Tipos e Interfaces | PascalCase | `ColumnMeta`, `ChartConfig` |
| Constantes globais | UPPER_SNAKE | `MAX_FILE_SIZE_MB` |
| Rotas de API | kebab-case | `ai-analyze/route.ts` |
| Variáveis do banco | snake_case | `password_hash` |
| Props de componentes | PascalCase + sufixo `Props` | `ChartCardProps` |

---

## Regras obrigatórias

```ts
// ❌ Proibido
function process(data: any) { ... }

// ✅ Correto — usar unknown + type guard
function process(data: unknown) {
  if (!isColumnMeta(data)) throw new Error("Tipo inválido");
  // data agora é ColumnMeta
}

// ❌ Proibido — não tipar props
export function Card({ data }) { ... }

// ✅ Correto — sempre tipar props explicitamente
interface CardProps { data: ColumnMeta[] }
export function Card({ data }: CardProps) { ... }

// ✅ Usar satisfies para validar literals
const PROVIDERS = ["openai", "anthropic", "google", "groq"] as const;
type Provider = typeof PROVIDERS[number]; // "openai" | "anthropic" | "google" | "groq"
```

---

## Proibições

- `any` sem comentário explicando o motivo — usar `unknown` com type guard
- `// @ts-ignore` sem comentário justificado
- Tipos de retorno omitidos em funções públicas/exportadas
- Interfaces com campos opcionais desnecessários (`?`) — preferir tipos union explícitos
