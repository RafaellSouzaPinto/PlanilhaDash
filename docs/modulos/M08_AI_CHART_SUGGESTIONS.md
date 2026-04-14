# M08 — Gráficos Contextuais por IA

| Campo        | Valor                                           |
|--------------|-------------------------------------------------|
| Módulo       | M08                                             |
| Título       | Gráficos Contextuais por IA                     |
| Status       | Planejado                                       |
| Versão       | 1.0                                             |
| Data         | 2026-04-14                                      |
| Dependências | M03 (chartEngine), M04 (AI analyze), M01 (auth) |

---

## 1. Visão Geral

### Problema

O módulo M03 (Chart Engine) usa regras determinísticas para selecionar gráficos com base nos tipos de coluna inferidos. Essa abordagem ignora o contexto semântico dos dados: uma planilha de "vendas por região" e uma planilha de "temperaturas climáticas" podem ter colunas do mesmo tipo (`categorical` + `number`) mas demandam visualizações completamente diferentes em prioridade, escala e intenção analítica.

### Valor para o usuário

Quando o usuário tem uma chave de API de IA configurada, em vez de receber até 4 gráficos gerados por regras fixas, ele recebe sugestões contextuais com justificativa — a IA examina os dados reais, entende o domínio e propõe gráficos apropriados. O usuário então escolhe quais gerar (máximo 4), com total controle sobre o resultado final.

Para usuários sem chave configurada, o comportamento anterior é preservado integralmente: `buildChartConfigs()` roda sem qualquer alteração.

---

## 2. User Stories

**US-01** — Como usuário com chave de IA configurada, ao fazer upload de uma planilha, quero que a IA sugira gráficos contextualmente relevantes para que eu não precise interpretar manualmente quais visualizações fazem mais sentido para meus dados.

**US-02** — Como usuário, quero ver uma breve justificativa para cada gráfico sugerido ("por que a IA recomendou este gráfico") para que eu possa tomar uma decisão informada sobre quais selecionar.

**US-03** — Como usuário, quero poder selecionar entre 1 e 4 gráficos das sugestões da IA para que meu dashboard final reflita exatamente o que é mais relevante para minha análise.

**US-04** — Como usuário sem chave de IA configurada, quero que o upload funcione normalmente com os gráficos automáticos para que eu não seja bloqueado por não ter uma chave configurada.

**US-05** — Como usuário, se a IA falhar ou demorar demais, quero receber os gráficos automáticos como fallback para que o dashboard seja gerado de qualquer forma, sem mensagem de erro bloqueante.

---

## 3. Fluxo Completo do Usuário

```
┌─────────────────────────────────────────┐
│  Usuário faz upload do arquivo          │
│  parseFile() + inferTypes() rodam       │
│  client-side (sem alteração)            │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  GET /api/user/api-key                  │
│  { hasApiKey, aiProvider }              │
└──────────────────┬──────────────────────┘
                   │
          ┌────────┴────────┐
     hasApiKey=false    hasApiKey=true
          │                 │
          ▼                 ▼
  ┌───────────────┐  ┌──────────────────────────┐
  │buildChartConf │  │POST /api/ai-chart-        │
  │igs() roda     │  │suggestions                │
  │imediatamente  │  │(columnsMeta, sampleRows)  │
  │(sem mudança)  │  └──────────┬───────────────┘
  └───────┬───────┘      ┌──────┴──────┐
          │          sucesso        falha/timeout
          │              │              │
          │              ▼              ▼
          │    ┌──────────────────┐  ┌─────────────────┐
          │    │ChartSuggestion[] │  │buildChartConfigs│
          │    │retornadas (2-6)  │  │() como fallback │
          │    └────────┬─────────┘  └────────┬────────┘
          │             │                      │
          │             ▼                      │
          │    ┌──────────────────┐            │
          │    │ChartSuggestion   │            │
          │    │Selector exibido  │            │
          │    │Usuário seleciona │            │
          │    │1-4 sugestões     │            │
          │    └────────┬─────────┘            │
          │             │                      │
          │             ▼                      │
          │    ┌──────────────────┐            │
          │    │buildChartFrom    │            │
          │    │Suggestion() conv.│            │
          │    │cada seleção em   │            │
          │    │ChartConfig+data  │            │
          │    └────────┬─────────┘            │
          └─────────────┴──────────────────────┘
                        │
                        ▼
             ┌────────────────────┐
             │ChartGrid renderiza │
             │dashboard final     │
             │(até 4 gráficos)    │
             └────────────────────┘
                        │
                        ▼
             ┌────────────────────┐
             │Botões: "Analisar   │
             │com IA" (insights), │
             │"Salvar Relatório"  │
             │permanecem          │
             └────────────────────┘
```

### Cenário: usuário seleciona 0 gráficos

O botão "Gerar dashboard" fica desabilitado enquanto `selectedCount === 0`. Não há mensagem de erro — o estado visual do botão é suficiente.

### Cenário: IA retorna 0 sugestões

A rota detecta e aciona fallback com `buildChartConfigs()`. O componente `ChartSuggestionSelector` não é exibido; o dashboard é gerado automaticamente com um aviso inline: "A IA não gerou sugestões para esta planilha. Exibindo gráficos automáticos."

---

## 4. Novos Tipos TypeScript

Adicionar em `src/types/spreadsheet.ts`:

```typescript
/**
 * Uma sugestão de gráfico gerada pela IA.
 * Tipo transiente — nunca persistido no banco.
 * Contém metadados suficientes para construir um ChartConfig completo.
 */
export interface ChartSuggestion {
  /** Tipo do gráfico sugerido */
  type: ChartType;
  /** Coluna a ser usada no eixo X (nome exato conforme ColumnMeta) */
  xKey: string;
  /** Coluna a ser usada no eixo Y — obrigatória para line, bar, barHorizontal */
  yKey?: string;
  /** Título humano para o gráfico */
  title: string;
  /**
   * Justificativa da IA para esta sugestão.
   * Deve conter um fato concreto dos dados (número, proporção ou padrão observado).
   * Máximo 2 frases. String vazia quando a sugestão vem do fallback determinístico.
   */
  rationale: string;
  /**
   * Prioridade da sugestão (1 = mais relevante).
   * A IA retorna sugestões já ordenadas por prioridade crescente.
   */
  priority: number;
}

/**
 * Resposta da API POST /api/ai-chart-suggestions
 */
export interface ChartSuggestionsResponse {
  suggestions: ChartSuggestion[];
  /** true se houve fallback para buildChartConfigs() por erro ou resposta vazia da IA */
  fallback: boolean;
  /** Motivo do fallback; null quando fallback === false */
  fallbackReason: string | null;
}
```

---

## 5. Nova API Route: `POST /api/ai-chart-suggestions`

### Localização

`src/app/api/ai-chart-suggestions/route.ts`

### Responsabilidade

Recebe metadados das colunas e amostra de dados, consulta a IA com `suggestChartsWithAI()`, e retorna `ChartSuggestion[]`. Em caso de falha da IA ou resposta vazia, retorna HTTP 200 com `fallback: true` e sugestões do engine determinístico — nunca retorna 5xx para o cliente por falha da IA.

### Schema Zod de Request

```typescript
const chartSuggestionsRequestSchema = z.object({
  columnsMeta: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.enum([
          "number",
          "currency",
          "percentage",
          "date",
          "categorical",
          "text",
        ]),
        stats: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
          uniqueCount: z.number().int().nonnegative(),
          sampleValues: z.array(z.unknown()),
        }),
      })
    )
    .min(1)
    .max(100),
  sampleRows: z.array(z.record(z.unknown())).max(50),
});
```

### Códigos de Resposta

| Código | Condição                                                          |
|--------|-------------------------------------------------------------------|
| 200    | Sucesso ou fallback gracioso por falha da IA                      |
| 400    | Body JSON malformado                                              |
| 400    | Validação Zod falhou                                              |
| 400    | Usuário não tem chave de API configurada (`aiApiKey` null)        |
| 401    | Sessão inexistente ou inválida                                    |

Erros de IA (timeout, quota, model unavailable) **nunca** produzem 5xx — resultam em `{ fallback: true, fallbackReason: string }` com HTTP 200.

### Implementação

```typescript
// src/app/api/ai-chart-suggestions/route.ts
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";
import { suggestChartsWithAI } from "@/lib/ai/suggestCharts";
import { buildChartConfigs } from "@/lib/chartEngine";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ChartSuggestion, ColumnMeta } from "@/types/spreadsheet";

const chartSuggestionsRequestSchema = z.object({
  columnsMeta: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.enum([
          "number",
          "currency",
          "percentage",
          "date",
          "categorical",
          "text",
        ]),
        stats: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
          uniqueCount: z.number().int().nonnegative(),
          sampleValues: z.array(z.unknown()),
        }),
      })
    )
    .min(1)
    .max(100),
  sampleRows: z.array(z.record(z.unknown())).max(50),
});

export async function POST(req: Request): Promise<Response> {
  const validated = await validateSession();
  if (!validated) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const parsed = chartSuggestionsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const [user] = await db
    .select({ aiProvider: users.aiProvider, aiApiKey: users.aiApiKey })
    .from(users)
    .where(eq(users.id, validated.user.id))
    .limit(1);

  if (!user?.aiApiKey || !user?.aiProvider) {
    return Response.json(
      { error: "Chave de API não configurada." },
      { status: 400 }
    );
  }

  const columnsMeta = parsed.data.columnsMeta as ColumnMeta[];
  const sampleRows = parsed.data.sampleRows;

  try {
    const suggestions = await suggestChartsWithAI(
      user.aiProvider,
      user.aiApiKey,
      columnsMeta,
      sampleRows
    );

    if (suggestions.length === 0) {
      const fallbackConfigs = buildChartConfigs(columnsMeta, sampleRows);
      return Response.json({
        suggestions: fallbackConfigs.map(configToSuggestion),
        fallback: true,
        fallbackReason: "A IA não retornou sugestões para esta planilha.",
      });
    }

    return Response.json({ suggestions, fallback: false, fallbackReason: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    const fallbackConfigs = buildChartConfigs(columnsMeta, sampleRows);
    return Response.json({
      suggestions: fallbackConfigs.map(configToSuggestion),
      fallback: true,
      fallbackReason: message,
    });
  }
}

function configToSuggestion(
  config: import("@/types/spreadsheet").ChartConfig,
  index: number
): ChartSuggestion {
  return {
    type: config.type,
    xKey: config.xKey,
    yKey: config.yKey,
    title: config.title,
    rationale: "",
    priority: index + 1,
  };
}
```

### Notas de Segurança

- `userId` sempre vem da sessão do servidor — nunca do request body.
- A chave de API é buscada do banco via `userId` da sessão e descriptografada em memória apenas dentro de `suggestChartsWithAI()`.
- O `provider` vem do banco — nunca aceito do cliente.
- A rota não retorna nem loga o valor descriptografado da chave em nenhuma circunstância.

---

## 6. Nova Lib Function: `suggestChartsWithAI()`

### Localização

`src/lib/ai/suggestCharts.ts`

### Assinatura

```typescript
export async function suggestChartsWithAI(
  provider: string,
  encryptedKey: string,
  columnsMeta: ColumnMeta[],
  sampleRows: Record<string, unknown>[]
): Promise<ChartSuggestion[]>
```

### Estratégia

Usa `generateText()` do Vercel AI SDK 4.x — mesma interface de `analyze.ts`. O prompt solicita JSON puro sem markdown fences, diretamente parseável via `JSON.parse()`. Mesmo `DEFAULT_MODELS` e `FALLBACK_MODELS` de `analyze.ts`. `maxTokens: 800` (menor que os 1200 de análise, pois a resposta é estruturada e compacta).

### Tratamento de Erros Internos

1. `JSON.parse()` falha → lança `new Error("AI retornou JSON inválido")` — capturado pela rota, ativa fallback.
2. Array retornado não é array → lança `new Error("Formato de resposta inválido")`.
3. Cada item validado com schema Zod interno; itens inválidos são descartados silenciosamente.
4. Colunas referenciadas em `xKey`/`yKey` inexistentes em `columnsMeta` → item descartado.
5. `type` que não é `ChartType` válido → item descartado.
6. Erros com mensagem contendo `"not found"` ou `"service_unavailable"` → tenta próximo modelo do fallback chain (apenas Google tem fallback).
7. Erros de autenticação/quota → lançados imediatamente sem retry.

### Implementação

```typescript
// src/lib/ai/suggestCharts.ts
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { decryptApiKey } from "@/lib/crypto/apiKey";
import { z } from "zod";
import type { ColumnMeta, ChartSuggestion, ChartType } from "@/types/spreadsheet";

const AI_SAMPLE_ROWS = Number(process.env.AI_SAMPLE_ROWS ?? 50);

const DEFAULT_MODELS: Record<string, string> = {
  openai:    "gpt-4o-mini",
  anthropic: "claude-3-haiku-20240307",
  google:    "gemini-2.5-flash",
  groq:      "llama-3.1-8b-instant",
};

const FALLBACK_MODELS: Record<string, string[]> = {
  google: ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash"],
};

const VALID_CHART_TYPES = new Set<ChartType>([
  "line",
  "bar",
  "pie",
  "barHorizontal",
  "table",
]);

const suggestionItemSchema = z.object({
  type: z.string(),
  xKey: z.string().min(1),
  yKey: z.string().optional(),
  title: z.string().min(1),
  rationale: z.string(),
  priority: z.number().int().positive(),
});

function createModel(provider: string, apiKey: string, modelName: string) {
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })(modelName);
    case "anthropic":
      return createAnthropic({ apiKey })(modelName);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelName);
    case "groq":
      return createGroq({ apiKey })(modelName);
    default:
      throw new Error(`Provider não suportado: ${provider}`);
  }
}

const SUGGEST_SYSTEM_PROMPT = `Você é um especialista em visualização de dados.

TAREFA: Analisar os metadados e dados de uma planilha e sugerir entre 2 e 6 gráficos contextuais relevantes.

REGRAS ABSOLUTAS:
1. Responda APENAS com um array JSON válido. Nenhum texto antes ou depois. Nenhum markdown.
2. Cada objeto deve ter: "type", "xKey", "title", "rationale", "priority". O campo "yKey" é obrigatório para types "line", "bar" e "barHorizontal".
3. "type" deve ser um dos seguintes valores EXATOS: "line", "bar", "pie", "barHorizontal", "table".
4. "xKey" e "yKey" devem ser nomes EXATOS de colunas da lista fornecida — nenhuma invenção.
5. "rationale" deve conter um fato concreto dos dados (número, proporção, ou padrão observado). Máximo 2 frases.
6. "priority" é um inteiro começando em 1 (mais relevante primeiro).
7. Máximo 6 sugestões. Não repita combinações de colunas idênticas.
8. Para "pie": use apenas colunas com uniqueCount <= 8.
9. Para "line": use apenas colunas do tipo "date" no xKey.
10. Se os dados não comportarem gráficos significativos, retorne um array com um único item do tipo "table".`;

function buildSuggestionsPrompt(
  columnsMeta: ColumnMeta[],
  sampleRows: Record<string, unknown>[]
): string {
  const colDesc = columnsMeta
    .map((c) => {
      const parts = [`${c.name} (${c.type})`, `únicos: ${c.stats.uniqueCount}`];
      if (c.stats.min !== undefined) parts.push(`min: ${c.stats.min}`);
      if (c.stats.max !== undefined) parts.push(`max: ${c.stats.max}`);
      if (c.stats.sampleValues.length > 0) {
        parts.push(`amostras: ${JSON.stringify(c.stats.sampleValues.slice(0, 3))}`);
      }
      return `- ${parts.join(" | ")}`;
    })
    .join("\n");

  const sample = sampleRows.slice(0, AI_SAMPLE_ROWS);

  return `## Colunas disponíveis (${columnsMeta.length}):\n${colDesc}\n\n## Amostra de dados (${sample.length} linhas):\n${JSON.stringify(sample)}`;
}

export async function suggestChartsWithAI(
  provider: string,
  encryptedKey: string,
  columnsMeta: ColumnMeta[],
  sampleRows: Record<string, unknown>[]
): Promise<ChartSuggestion[]> {
  const apiKey = decryptApiKey(encryptedKey);
  const defaultModel = DEFAULT_MODELS[provider];
  if (!defaultModel) throw new Error(`Provider não suportado: ${provider}`);

  const dataPrompt = buildSuggestionsPrompt(columnsMeta, sampleRows);
  const columnNames = new Set(columnsMeta.map((c) => c.name));
  const modelsToTry = Array.from(
    new Set([defaultModel, ...(FALLBACK_MODELS[provider] ?? [])])
  );

  let lastError: Error | null = null;

  for (const modelName of modelsToTry) {
    try {
      const model = createModel(provider, apiKey, modelName);
      const result = await generateText({
        model,
        system: SUGGEST_SYSTEM_PROMPT,
        prompt: dataPrompt,
        maxTokens: 800,
      });

      let raw: unknown;
      try {
        raw = JSON.parse(result.text.trim());
      } catch {
        throw new Error("AI retornou JSON inválido");
      }

      if (!Array.isArray(raw)) {
        throw new Error("Formato de resposta inválido: esperado array");
      }

      const suggestions: ChartSuggestion[] = [];
      for (const item of raw) {
        const parsed = suggestionItemSchema.safeParse(item);
        if (!parsed.success) continue;

        const { type, xKey, yKey, title, rationale, priority } = parsed.data;

        if (!VALID_CHART_TYPES.has(type as ChartType)) continue;
        if (!columnNames.has(xKey)) continue;
        if (yKey !== undefined && !columnNames.has(yKey)) continue;

        suggestions.push({
          type: type as ChartType,
          xKey,
          yKey,
          title,
          rationale,
          priority,
        });
      }

      return suggestions.sort((a, b) => a.priority - b.priority);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message.toLowerCase();

      if (
        msg.includes("not found") ||
        msg.includes("not supported") ||
        msg.includes("service_unavailable") ||
        msg.includes("503")
      ) {
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new Error("Falha ao conectar com a IA");
}
```

---

## 7. Geração de Dados: `buildChartFromSuggestion()`

### Localização

`src/lib/chartEngine.ts` — nova função exportada no mesmo arquivo, reutilizando as helpers privadas já existentes (`aggregateBarData`, `countByCategory`, `parsePercentage`).

### Assinatura

```typescript
export function buildChartFromSuggestion(
  suggestion: ChartSuggestion,
  rows: Record<string, unknown>[]
): ChartConfig
```

### Implementação

```typescript
export function buildChartFromSuggestion(
  suggestion: ChartSuggestion,
  rows: Record<string, unknown>[]
): ChartConfig {
  const { type, xKey, yKey, title } = suggestion;

  switch (type) {
    case "line": {
      return {
        type: "line",
        xKey,
        yKey,
        title,
        data: rows.map((r) => ({
          [xKey]: r[xKey],
          ...(yKey ? { [yKey]: r[yKey] } : {}),
        })),
      };
    }
    case "bar": {
      if (!yKey) throw new Error(`yKey obrigatório para tipo "bar"`);
      return {
        type: "bar",
        xKey,
        yKey,
        title,
        data: aggregateBarData(rows, xKey, yKey),
      };
    }
    case "barHorizontal": {
      return {
        type: "barHorizontal",
        xKey,
        yKey,
        title,
        data: rows.slice(0, 20).map((r) => ({
          [xKey]: parsePercentage(r[xKey]),
          ...(yKey ? { [yKey]: r[yKey] } : {}),
        })),
      };
    }
    case "pie": {
      return {
        type: "pie",
        xKey,
        title,
        data: countByCategory(rows, xKey),
      };
    }
    case "table":
    default: {
      return {
        type: "table",
        xKey,
        title,
        data: rows.slice(0, 50),
      };
    }
  }
}
```

**Coluna inexistente:** Se `xKey` ou `yKey` referenciar uma coluna ausente nas rows, a função retorna `ChartConfig` com `data: []` sem lançar erro. O dashboard renderiza o gráfico vazio ao invés de quebrar.

---

## 8. Novo Componente: `ChartSuggestionSelector`

### Localização

`src/components/ai/ChartSuggestionSelector.tsx`

### Props

```typescript
interface ChartSuggestionSelectorProps {
  suggestions: ChartSuggestion[];
  onConfirm: (selected: ChartSuggestion[]) => void;
  loading: boolean;
}
```

### Descrição de UI

Painel com título "Sugestões da IA" e subtítulo "Selecione até 4 gráficos para seu dashboard". Cada sugestão é exibida como um card com:

- Ícone do tipo de gráfico (`BarChart2`, `LineChart`, `PieChart`, etc. do `lucide-react`)
- Título da sugestão em destaque
- Badge secundário com o tipo do gráfico ("Barras", "Linha", "Pizza", "Barras Horiz.", "Tabela")
- Texto de `rationale` em fonte menor (`text-muted-foreground`)
- Checkbox na posição superior direita
- Borda destacada (`ring-2 ring-primary`) quando selecionado

Abaixo dos cards: contador "X de 4 selecionados" e botão primário "Gerar dashboard com seleção" (desabilitado quando `selectedCount === 0`).

Estado de loading: 4 skeletons de card (`data-testid="suggestion-skeleton"`) no lugar das sugestões reais.

### Lógica de Seleção

```typescript
function handleToggle(suggestion: ChartSuggestion) {
  setSelected((prev) => {
    const key = `${suggestion.type}:${suggestion.xKey}:${suggestion.yKey ?? ""}`;
    const isSelected = prev.some(
      (s) => `${s.type}:${s.xKey}:${s.yKey ?? ""}` === key
    );
    if (isSelected) {
      return prev.filter(
        (s) => `${s.type}:${s.xKey}:${s.yKey ?? ""}` !== key
      );
    }
    if (prev.length >= 4) return prev; // Checkbox desabilitado via UI
    return [...prev, suggestion];
  });
}
```

Quando `selected.length === 4`, todos os checkboxes não selecionados ficam com `disabled`. Desmarcar uma seleção reabilita os demais.

O botão "Confirmar seleção" chama `onConfirm(selected)`. O pai (upload page) invoca `buildChartFromSuggestion()` para cada item e define `chartsConfig`.

---

## 9. Alterações na Upload Page

**Arquivo:** `src/app/(app)/upload/page.tsx`

### Novos estados

```typescript
const [suggestionsLoading, setSuggestionsLoading] = useState(false);
const [suggestions, setSuggestions] = useState<ChartSuggestion[]>([]);
const [showSuggestions, setShowSuggestions] = useState(false);
const [suggestionsFallback, setSuggestionsFallback] = useState(false);
```

### Alteração em `handleFileAccepted`

Após `inferTypes()`, antes de chamar `buildChartConfigs()`, verificar se o usuário tem chave:

```typescript
const handleFileAccepted = useCallback(async (f: File) => {
  // ... reset de estados existentes ...
  setParsing(true);

  try {
    const parsed = await parseFile(f);
    const cols = inferTypes(parsed);
    setRows(parsed);
    setColumnsMeta(cols);

    const keyRes = await fetch("/api/user/api-key");
    const keyData = await keyRes.json();

    if (!keyData.hasApiKey) {
      // Caminho sem IA: determinístico imediato
      setChartsConfig(buildChartConfigs(cols, parsed));
    } else {
      // Caminho com IA: solicitar sugestões
      setSuggestionsLoading(true);
      setShowSuggestions(true);

      const suggestRes = await fetch("/api/ai-chart-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnsMeta: cols,
          sampleRows: parsed.slice(0, 50),
        }),
      });

      const suggestData: ChartSuggestionsResponse = await suggestRes.json();

      if (!suggestRes.ok) {
        // 400/401: fallback local silencioso
        setChartsConfig(buildChartConfigs(cols, parsed));
        setShowSuggestions(false);
      } else if (suggestData.fallback) {
        // Fallback remoto: usar sugestões sem rationale diretamente
        const charts = suggestData.suggestions
          .slice(0, 4)
          .map((s) => buildChartFromSuggestion(s, parsed));
        setChartsConfig(charts);
        setSuggestionsFallback(true);
        setShowSuggestions(false);
      } else {
        setSuggestions(suggestData.suggestions);
      }
    }
  } catch {
    if (columnsMeta.length > 0) {
      setChartsConfig(buildChartConfigs(columnsMeta, rows));
    }
  } finally {
    setParsing(false);
    setSuggestionsLoading(false);
  }
}, [columnsMeta, rows]);
```

### Renderização do Seletor

```tsx
{showSuggestions && (
  <ChartSuggestionSelector
    suggestions={suggestions}
    loading={suggestionsLoading}
    onConfirm={(selected) => {
      const charts = selected.map((s) => buildChartFromSuggestion(s, rows));
      setChartsConfig(charts);
      setShowSuggestions(false);
    }}
  />
)}

{suggestionsFallback && chartsConfig.length > 0 && (
  <Alert>
    <AlertDescription>
      A IA não gerou sugestões para esta planilha. Exibindo gráficos automáticos.
    </AlertDescription>
  </Alert>
)}
```

### O que NÃO muda

- `handleAnalyzeAI` — botão "Analisar com IA" chama `POST /api/ai-analyze` inalterado.
- `handleSaveReport` — `chartsConfig` é preenchido por qualquer caminho antes do save.
- `ChartGrid`, `InsightsPanel`, `ExportButton`, `ApiKeyModal` — sem alterações.

---

## 10. Design do Prompt de IA

### System Prompt

```
Você é um especialista em visualização de dados.

TAREFA: Analisar os metadados e dados de uma planilha e sugerir entre 2 e 6 gráficos contextuais relevantes.

REGRAS ABSOLUTAS:
1. Responda APENAS com um array JSON válido. Nenhum texto antes ou depois. Nenhum markdown.
2. Cada objeto deve ter: "type", "xKey", "title", "rationale", "priority". O campo "yKey" é obrigatório para types "line", "bar" e "barHorizontal".
3. "type" deve ser um dos seguintes valores EXATOS: "line", "bar", "pie", "barHorizontal", "table".
4. "xKey" e "yKey" devem ser nomes EXATOS de colunas da lista fornecida — nenhuma invenção.
5. "rationale" deve conter um fato concreto dos dados (número, proporção, ou padrão observado). Máximo 2 frases.
6. "priority" é um inteiro começando em 1 (mais relevante primeiro).
7. Máximo 6 sugestões. Não repita combinações de colunas idênticas.
8. Para "pie": use apenas colunas com uniqueCount <= 8.
9. Para "line": use apenas colunas do tipo "date" no xKey.
10. Se os dados não comportarem gráficos significativos, retorne um array com um único item do tipo "table".
```

### User Prompt Template

```
## Colunas disponíveis ({N} colunas):
- {nome} ({tipo}) | únicos: {uniqueCount} | min: {min} | max: {max} | amostras: [{val1}, {val2}, {val3}]
...

## Amostra de dados ({n} linhas):
[{...}, {...}, ...]
```

### Exemplo de Resposta Esperada

Para planilha com `data (date)`, `região (categorical, 6 únicos)`, `total_vendas (number)`, `margem (percentage)`:

```json
[
  {
    "type": "bar",
    "xKey": "região",
    "yKey": "total_vendas",
    "title": "Total de Vendas por Região",
    "rationale": "6 regiões com alta variação (min: 12.400, max: 87.200). Barras verticais facilitam comparação direta.",
    "priority": 1
  },
  {
    "type": "line",
    "xKey": "data",
    "yKey": "total_vendas",
    "title": "Evolução de Vendas ao Longo do Tempo",
    "rationale": "Série temporal de 24 meses. Permite identificar tendências e sazonalidade.",
    "priority": 2
  },
  {
    "type": "barHorizontal",
    "xKey": "margem",
    "yKey": "região",
    "title": "Margem (%) por Região",
    "rationale": "Coluna de percentual presente. Barras horizontais facilitam leitura de rankings percentuais.",
    "priority": 3
  },
  {
    "type": "pie",
    "xKey": "região",
    "title": "Distribuição de Vendas por Região",
    "rationale": "6 categorias distintas (≤ 8). Pizza revela participação relativa de cada região no total.",
    "priority": 4
  }
]
```

---

## 11. Edge Cases e Fallbacks

| Cenário | Comportamento |
|---------|---------------|
| Usuário sem chave de API | `buildChartConfigs()` roda imediatamente após parse, sem chamada de rede |
| IA retorna JSON inválido (ex: resposta em markdown) | `JSON.parse` lança → rota captura → fallback com `buildChartConfigs()` |
| IA retorna array vazio `[]` | Rota detecta, usa fallback determinístico, `fallbackReason` informa o motivo |
| IA retorna itens com colunas inexistentes | Itens descartados na validação de `suggestChartsWithAI()`; se array vazio resultante → rota aplica fallback |
| IA retorna `type` inválido (ex: `"scatter"`) | Item descartado silenciosamente |
| Timeout de rede (fetch do cliente) | `catch` no `handleFileAccepted` → `buildChartConfigs()` local |
| HTTP 400 retornado (chave ausente no banco) | Upload page usa `buildChartConfigs()` local, sem exibir erro ao usuário |
| HTTP 401 (sessão expirou entre upload e suggest) | Middleware redireciona para `/login` (comportamento padrão) |
| Usuário seleciona 0 gráficos | Botão "Confirmar" permanece `disabled` |
| Usuário seleciona 4 gráficos | Checkboxes não selecionadas ficam `disabled` |
| Provider Google — modelo não encontrado | Fallback de modelos: `gemini-flash-latest` → `gemini-2.0-flash` |
| Menos de 2 colunas na planilha | IA retorna `[{ type: "table", ... }]` (regra 10 do prompt) |

---

## 12. Considerações de Segurança

### Chave de API

- Descriptografada **apenas dentro de `suggestChartsWithAI()`**, em memória, descartada imediatamente após a chamada.
- Nunca aparece em logs, headers, corpo de resposta, ou rastreamento de erros.
- O `provider` é sempre lido do banco via `userId` da sessão — nunca aceito do request body.

### Dados Enviados à IA

- Apenas `columnsMeta` e `sampleRows` (máximo 50 linhas) são enviados ao provider.
- Nenhum dado de autenticação, ID de usuário, ou chave de API é incluído no prompt.

### Rate Limiting

- A rota consome tokens do provider do usuário (modelo BYOK — custo arcado pelo próprio usuário).
- Rate limiting por `userId` é recomendado como middleware futuro (Redis-based), mas não é escopo do M08.
- Erros de quota (`429`, `RESOURCE_EXHAUSTED`) são capturados e resultam em fallback gracioso sem expor a mensagem bruta ao usuário.

---

## 13. Sem Alterações no Schema de Banco de Dados

Nenhuma migração é necessária. Motivo:

- `chartsConfig: json("charts_config").$type<ChartConfig[]>()` na tabela `reports` armazena o array final de `ChartConfig[]` — exatamente o que é gerado após o usuário confirmar a seleção e `buildChartFromSuggestion()` ser chamado para cada item selecionado.
- `ChartSuggestion[]` é um tipo **transiente de UX** — existe apenas durante a interação do upload e nunca precisa ser persistido.
- O relatório salvo via `POST /api/reports` é idêntico independente da origem dos gráficos (sugestão por IA ou engine determinístico).

---

## 14. Integração com `analyzeWithAI` (Insights de Texto)

O M08 é completamente independente da análise textual existente (M04). Após o usuário confirmar a seleção e o `chartsConfig` ser definido:

- O botão "Analisar com IA" permanece disponível e funciona identicamente ao comportamento pré-M08.
- `POST /api/ai-analyze` recebe o `chartsConfig` final (incluindo gráficos selecionados via IA), gerando insights contextualizados para os gráficos que o usuário escolheu.
- Há sinergia natural: os gráficos são contextuais (sugeridos pela IA) e os insights textuais comentam exatamente esses gráficos.
- O `chartsConfig` salvo em `POST /api/reports` é o mesmo tanto para dashboards gerados via sugestões de IA quanto via regras determinísticas — a interface downstream não distingue a origem.

---

## 15. Resumo dos Arquivos a Criar/Modificar

| Ação     | Arquivo                                               | Descrição                                       |
|----------|-------------------------------------------------------|-------------------------------------------------|
| Criar    | `src/lib/ai/suggestCharts.ts`                         | Função principal de sugestão por IA             |
| Criar    | `src/app/api/ai-chart-suggestions/route.ts`           | API route com validação e fallback              |
| Criar    | `src/components/ai/ChartSuggestionSelector.tsx`       | Componente de seleção de sugestões              |
| Modificar | `src/types/spreadsheet.ts`                           | Adicionar `ChartSuggestion`, `ChartSuggestionsResponse` |
| Modificar | `src/lib/chartEngine.ts`                             | Adicionar `buildChartFromSuggestion()`          |
| Modificar | `src/app/(app)/upload/page.tsx`                      | Orquestração com branching por API key          |
