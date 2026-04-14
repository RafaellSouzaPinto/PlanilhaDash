# M08 — Gráficos Contextuais por IA: Especificação de Testes

| Campo      | Valor                                                    |
|------------|----------------------------------------------------------|
| Módulo     | M08                                                      |
| Estratégia | Unitários (Vitest + node) + Componente (jsdom) + Integração |
| Ambiente   | Vitest 2.x, jsdom para testes de componente              |
| Data       | 2026-04-14                                               |

---

## 1. Estratégia de Testes

### Pirâmide de cobertura

```
              [Integração: 3 cenários]
           Upload → Suggest → Select → Save

         [API Route: 7 casos]
    POST /api/ai-chart-suggestions

   [Componente: 7 casos]
   ChartSuggestionSelector

[Unit: suggestChartsWithAI — 7]   [Unit: buildChartFromSuggestion — 5]

           [Unit: Zod schema — 5]
```

### Ferramentas e configuração

- **Runner:** Vitest 2.x (`npm run test` / `npm run test:watch`)
- **Ambiente padrão:** `node` (conforme `vitest.config.ts` existente)
- **Ambiente de componente:** `jsdom` — ativado via comentário `// @vitest-environment jsdom` no topo do arquivo de teste
- **Mock de IA:** `vi.mock("ai")` e `vi.mock("@/lib/ai/suggestCharts")` — nunca chamar provider real
- **DB de teste:** MySQL/MariaDB via `DATABASE_URL` configurado em `vitest.config.ts` existente
- **Limpeza:** o `tests/setup.ts` existente já limpa `reports`, `sessions`, `users` no `beforeEach`

### Localização dos arquivos de teste

```
tests/
  fixtures/
    m08.ts                              ← dados reutilizáveis por todos os testes
  unit/
    suggestCharts.test.ts               ← suggestChartsWithAI() + Zod schema
    buildChartFromSuggestion.test.ts    ← buildChartFromSuggestion()
  integration/
    aiChartSuggestions.test.ts          ← POST /api/ai-chart-suggestions
    uploadSuggestFlow.test.ts           ← fluxo E2E com DB real
  components/
    ChartSuggestionSelector.test.tsx    ← componente React
```

---

## 2. Fixtures de Dados de Teste

**Arquivo:** `tests/fixtures/m08.ts`

```typescript
import type { ColumnMeta, ChartSuggestion } from "@/types/spreadsheet";

export const sampleColumnsMeta: ColumnMeta[] = [
  {
    name: "data",
    type: "date",
    stats: { uniqueCount: 24, sampleValues: ["2024-01-01", "2024-02-01", "2024-03-01"] },
  },
  {
    name: "região",
    type: "categorical",
    stats: { uniqueCount: 6, sampleValues: ["Sul", "Norte", "Leste"] },
  },
  {
    name: "total_vendas",
    type: "number",
    stats: { min: 1000, max: 87200, uniqueCount: 24, sampleValues: [12000, 45000, 67000] },
  },
  {
    name: "margem",
    type: "percentage",
    stats: { min: 5, max: 42, uniqueCount: 20, sampleValues: ["12%", "28%", "35%"] },
  },
];

export const sampleRows: Record<string, unknown>[] = [
  { data: "2024-01-01", região: "Sul",   total_vendas: 45000, margem: "28%" },
  { data: "2024-02-01", região: "Norte", total_vendas: 32000, margem: "22%" },
  { data: "2024-03-01", região: "Leste", total_vendas: 67000, margem: "35%" },
];

export const mockAISuggestions: ChartSuggestion[] = [
  {
    type: "bar",
    xKey: "região",
    yKey: "total_vendas",
    title: "Total de Vendas por Região",
    rationale: "6 regiões com alta variação (max: 87.200). Barras facilitam comparação direta.",
    priority: 1,
  },
  {
    type: "line",
    xKey: "data",
    yKey: "total_vendas",
    title: "Evolução de Vendas ao Longo do Tempo",
    rationale: "Série temporal de 24 meses. Permite identificar tendências.",
    priority: 2,
  },
  {
    type: "pie",
    xKey: "região",
    title: "Distribuição por Região",
    rationale: "6 categorias distintas (≤ 8). Pizza revela participação relativa.",
    priority: 3,
  },
];

// Resposta JSON válida da IA (string pura, sem markdown)
export const validMockAIResponse = JSON.stringify(mockAISuggestions);

// Respostas problemáticas para testes de robustez
export const invalidJsonResponse =
  "Aqui estão os gráficos sugeridos: bar, line, pie.";

export const emptyArrayResponse = "[]";

export const responseWithInvalidColumns = JSON.stringify([
  {
    type: "bar",
    xKey: "coluna_inexistente",
    yKey: "total_vendas",
    title: "Gráfico Inválido",
    rationale: "Teste de coluna inválida.",
    priority: 1,
  },
]);

export const responseWithInvalidChartType = JSON.stringify([
  {
    type: "scatter", // não é um ChartType válido
    xKey: "data",
    yKey: "total_vendas",
    title: "Scatter Plot",
    rationale: "Teste de tipo inválido.",
    priority: 1,
  },
]);

export const mixedValidInvalidResponse = JSON.stringify([
  {
    type: "bar",
    xKey: "região",
    yKey: "total_vendas",
    title: "Bar Válido",
    rationale: "Válido.",
    priority: 1,
  },
  {
    type: "scatter", // inválido — deve ser descartado
    xKey: "data",
    yKey: "total_vendas",
    title: "Scatter Inválido",
    rationale: "Inválido.",
    priority: 2,
  },
]);
```

---

## 3. Testes Unitários: `suggestChartsWithAI()`

**Arquivo:** `tests/unit/suggestCharts.test.ts`

### Setup base

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { suggestChartsWithAI } from "@/lib/ai/suggestCharts";
import { encryptApiKey } from "@/lib/crypto/apiKey";
import {
  sampleColumnsMeta,
  sampleRows,
  validMockAIResponse,
  invalidJsonResponse,
  emptyArrayResponse,
  responseWithInvalidColumns,
  responseWithInvalidChartType,
  mixedValidInvalidResponse,
} from "../fixtures/m08";

vi.mock("ai", () => ({ generateText: vi.fn() }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: vi.fn(() => vi.fn(() => "mock-model")) }));
vi.mock("@ai-sdk/anthropic", () => ({ createAnthropic: vi.fn(() => vi.fn(() => "mock-model")) }));
vi.mock("@ai-sdk/google", () => ({ createGoogleGenerativeAI: vi.fn(() => vi.fn(() => "mock-model")) }));
vi.mock("@ai-sdk/groq", () => ({ createGroq: vi.fn(() => vi.fn(() => "mock-model")) }));

const { generateText } = await import("ai");
const encryptedKey = encryptApiKey("sk-test-key-for-unit-tests");
```

---

### T-U01: retorna sugestões válidas quando a IA responde com JSON correto

- **Setup:** `vi.mocked(generateText).mockResolvedValue({ text: validMockAIResponse } as never)`
- **Input:** `suggestChartsWithAI("openai", encryptedKey, sampleColumnsMeta, sampleRows)`
- **Expected:**
  - Retorna array com 3 itens
  - Primeiro item: `{ type: "bar", xKey: "região", yKey: "total_vendas", priority: 1 }`
  - Array ordenado por `priority` crescente (1, 2, 3)
  - `generateText` chamado exatamente 1 vez

---

### T-U02: lança erro quando a IA retorna JSON inválido

- **Setup:** `vi.mocked(generateText).mockResolvedValue({ text: invalidJsonResponse } as never)`
- **Input:** `suggestChartsWithAI("openai", encryptedKey, sampleColumnsMeta, sampleRows)`
- **Expected:** Rejeita com `Error` cuja mensagem contém `"JSON inválido"`

---

### T-U03: retorna array vazio quando a IA retorna `[]`

- **Setup:** `vi.mocked(generateText).mockResolvedValue({ text: emptyArrayResponse } as never)`
- **Input:** `suggestChartsWithAI("openai", encryptedKey, sampleColumnsMeta, sampleRows)`
- **Expected:** Retorna `[]` sem lançar erro

---

### T-U04: descarta itens com colunas inexistentes em columnsMeta

- **Setup:** `vi.mocked(generateText).mockResolvedValue({ text: responseWithInvalidColumns } as never)`
- **Input:** `suggestChartsWithAI("openai", encryptedKey, sampleColumnsMeta, sampleRows)`
- **Expected:** Retorna `[]` (item com `xKey: "coluna_inexistente"` descartado)

---

### T-U05: descarta itens com `type` não reconhecido

- **Setup:** `vi.mocked(generateText).mockResolvedValue({ text: responseWithInvalidChartType } as never)`
- **Input:** `suggestChartsWithAI("openai", encryptedKey, sampleColumnsMeta, sampleRows)`
- **Expected:** Retorna `[]` (item com `type: "scatter"` descartado)

---

### T-U06: descarta apenas itens inválidos, preserva os válidos

- **Setup:** `vi.mocked(generateText).mockResolvedValue({ text: mixedValidInvalidResponse } as never)`
- **Input:** `suggestChartsWithAI("openai", encryptedKey, sampleColumnsMeta, sampleRows)`
- **Expected:**
  - Retorna array com 1 item (o bar válido)
  - Item retornado: `{ type: "bar", xKey: "região", yKey: "total_vendas" }`

---

### T-U07: tenta fallback de modelo quando Google retorna `not found`

- **Setup:**
  - Primeira chamada: `generateText` lança `new Error("model not found")`
  - Segunda chamada: `generateText` resolve com `{ text: validMockAIResponse }`
- **Input:** `suggestChartsWithAI("google", encryptedKey, sampleColumnsMeta, sampleRows)`
- **Expected:**
  - `generateText` chamado 2 vezes
  - Retorna array com 3 sugestões da segunda chamada

---

### T-U08: lança imediatamente em erros que não são de modelo (sem retry)

- **Setup:** `generateText` lança `new Error("Incorrect API key provided")`
- **Input:** `suggestChartsWithAI("openai", encryptedKey, sampleColumnsMeta, sampleRows)`
- **Expected:**
  - `generateText` chamado exatamente 1 vez
  - Rejeita com erro contendo `"Incorrect API key provided"`

---

## 4. Testes Unitários: `buildChartFromSuggestion()`

**Arquivo:** `tests/unit/buildChartFromSuggestion.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { buildChartFromSuggestion } from "@/lib/chartEngine";
import { sampleRows } from "../fixtures/m08";
import type { ChartSuggestion } from "@/types/spreadsheet";
```

---

### T-B01: converte sugestão `bar` em ChartConfig com dados agregados

- **Input:**
  ```typescript
  buildChartFromSuggestion(
    { type: "bar", xKey: "região", yKey: "total_vendas", title: "Vendas por Região", rationale: "...", priority: 1 },
    sampleRows
  )
  ```
- **Expected:**
  - `result.type === "bar"`
  - `result.xKey === "região"`, `result.yKey === "total_vendas"`
  - `result.data` é array com 3 entradas (Sul, Norte, Leste)
  - Cada entrada de `data` tem as chaves `"região"` e `"total_vendas"`
  - Valores somados por categoria (Sul=45000, Norte=32000, Leste=67000)

---

### T-B02: converte sugestão `line` em ChartConfig com dados brutos (não agregados)

- **Input:**
  ```typescript
  buildChartFromSuggestion(
    { type: "line", xKey: "data", yKey: "total_vendas", title: "Evolução", rationale: "...", priority: 2 },
    sampleRows
  )
  ```
- **Expected:**
  - `result.type === "line"`
  - `result.data.length === sampleRows.length` (3 linhas, não agregadas)
  - `result.data[0]` contém as chaves `"data"` e `"total_vendas"` com valores originais

---

### T-B03: converte sugestão `pie` em ChartConfig com contagens por categoria

- **Input:**
  ```typescript
  buildChartFromSuggestion(
    { type: "pie", xKey: "região", title: "Distribuição", rationale: "...", priority: 3 },
    sampleRows
  )
  ```
- **Expected:**
  - `result.type === "pie"`
  - `result.yKey` é `undefined`
  - `result.data` é array com objetos `{ name: string, value: number }`
  - 3 entradas correspondentes às 3 regiões distintas

---

### T-B04: retorna `data` sem lançar erro para coluna inexistente em `bar`

- **Input:**
  ```typescript
  buildChartFromSuggestion(
    { type: "bar", xKey: "coluna_fantasma", yKey: "total_vendas", title: "Teste", rationale: "", priority: 1 },
    sampleRows
  )
  ```
- **Expected:**
  - Não lança erro
  - `result.type === "bar"`
  - `result.data` pode ser `[]` ou array com valores `undefined` — o importante é não lançar

---

### T-B05: tipo `table` retorna slice de no máximo 50 linhas

- **Setup:** Gerar array `hundredRows` com 100 objetos: `Array.from({ length: 100 }, (_, i) => ({ id: i }))`
- **Input:**
  ```typescript
  buildChartFromSuggestion(
    { type: "table", xKey: "id", title: "Dados", rationale: "", priority: 1 },
    hundredRows
  )
  ```
- **Expected:** `result.data.length === 50`

---

## 5. Testes Unitários: Zod Schema da API Route

**Arquivo:** `tests/unit/suggestCharts.test.ts` (seção adicional) ou `tests/unit/aiChartSuggestionsSchema.test.ts`

O schema Zod deve ser extraído da route para um módulo testável, ou testado via chamada direta à route com mocks de sessão.

---

### T-Z01: aceita request válido com columnsMeta mínimo e sampleRows vazio

- **Input:**
  ```json
  {
    "columnsMeta": [
      { "name": "valor", "type": "number", "stats": { "uniqueCount": 5, "sampleValues": [] } }
    ],
    "sampleRows": []
  }
  ```
- **Expected:** `schema.safeParse(body).success === true`

---

### T-Z02: rejeita request sem `columnsMeta`

- **Input:** `{ "sampleRows": [{ "valor": 100 }] }`
- **Expected:** `schema.safeParse(body).success === false`

---

### T-Z03: rejeita `columnsMeta` com `type` não pertencente ao enum

- **Input:**
  ```json
  {
    "columnsMeta": [
      { "name": "col", "type": "boolean", "stats": { "uniqueCount": 2, "sampleValues": [] } }
    ],
    "sampleRows": []
  }
  ```
- **Expected:** `schema.safeParse(body).success === false`

---

### T-Z04: aceita `sampleRows` vazio (`[]`)

- **Input:**
  ```json
  {
    "columnsMeta": [
      { "name": "col", "type": "text", "stats": { "uniqueCount": 0, "sampleValues": [] } }
    ],
    "sampleRows": []
  }
  ```
- **Expected:** `schema.safeParse(body).success === true`

---

### T-Z05: rejeita `sampleRows` com mais de 50 itens

- **Setup:** `sampleRows: Array.from({ length: 51 }, () => ({ x: 1 }))`
- **Expected:** `schema.safeParse(body).success === false` (`.max(50)` violado)

---

## 6. Testes de API Route: `POST /api/ai-chart-suggestions`

**Arquivo:** `tests/integration/aiChartSuggestions.test.ts`

### Setup base

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { lucia } from "@/lib/auth/lucia";
import { encryptApiKey } from "@/lib/crypto/apiKey";
import { eq } from "drizzle-orm";
import { sampleColumnsMeta, sampleRows, mockAISuggestions } from "../fixtures/m08";

vi.mock("@/lib/ai/suggestCharts", () => ({
  suggestChartsWithAI: vi.fn(),
}));

const mockSet = vi.fn();
const mockGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => ({ set: mockSet, get: mockGet }),
}));

const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");

async function createUserWithApiKey(email: string) {
  const passwordHash = await hashPassword("testpass");
  const [u] = await db
    .insert(users)
    .values({
      name: "Test User",
      email,
      passwordHash,
      aiProvider: "openai",
      aiApiKey: encryptApiKey("sk-test-key"),
    })
    .$returningId();
  const session = await lucia.createSession(u.id, {});
  mockGet.mockReturnValue({ value: session.id });
  return { userId: u.id, sessionId: session.id };
}

async function createUserWithoutApiKey(email: string) {
  const passwordHash = await hashPassword("testpass");
  const [u] = await db
    .insert(users)
    .values({ name: "No Key User", email, passwordHash })
    .$returningId();
  const session = await lucia.createSession(u.id, {});
  mockGet.mockReturnValue({ value: session.id });
  return { userId: u.id, sessionId: session.id };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/ai-chart-suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = { columnsMeta: sampleColumnsMeta, sampleRows };
```

---

### T-R01: retorna 401 sem sessão válida

- **Setup:** `mockGet.mockReturnValue(undefined)`
- **Input:** `makeRequest(validBody)`
- **Expected:**
  - `res.status === 401`
  - `body.error` contém "Não autorizado"

---

### T-R02: retorna 400 com body JSON malformado

- **Setup:** `createUserWithApiKey("r02@test.com")`
- **Input:** `new Request(url, { method: "POST", body: "invalid json{" })`
- **Expected:**
  - `res.status === 400`
  - `body.error` contém "inválido"

---

### T-R03: retorna 400 quando usuário não tem chave de API configurada

- **Setup:**
  - `createUserWithoutApiKey("r03@test.com")`
  - `suggestChartsWithAI` **não deve** ser chamado
- **Input:** `makeRequest(validBody)`
- **Expected:**
  - `res.status === 400`
  - `body.error` contém "Chave de API não configurada"
  - `expect(suggestChartsWithAI).not.toHaveBeenCalled()`

---

### T-R04: retorna 200 com sugestões válidas quando IA responde corretamente

- **Setup:**
  - `createUserWithApiKey("r04@test.com")`
  - `vi.mocked(suggestChartsWithAI).mockResolvedValue(mockAISuggestions)`
- **Input:** `makeRequest(validBody)`
- **Expected:**
  - `res.status === 200`
  - `body.fallback === false`
  - `body.fallbackReason === null`
  - `body.suggestions.length === 3`
  - `body.suggestions[0].type === "bar"`
  - Body não contém `"sk-"` (asserção de segurança)

---

### T-R05: retorna 200 com fallback quando `suggestChartsWithAI` lança erro

- **Setup:**
  - `createUserWithApiKey("r05@test.com")`
  - `vi.mocked(suggestChartsWithAI).mockRejectedValue(new Error("timeout after 30s"))`
- **Input:** `makeRequest(validBody)`
- **Expected:**
  - `res.status === 200`
  - `body.fallback === true`
  - `body.fallbackReason` contém `"timeout"`
  - `body.suggestions.length > 0` (resultado de `buildChartConfigs`)
  - Todos os `body.suggestions[i].rationale === ""`

---

### T-R06: retorna 200 com fallback quando IA retorna array vazio

- **Setup:**
  - `createUserWithApiKey("r06@test.com")`
  - `vi.mocked(suggestChartsWithAI).mockResolvedValue([])`
- **Input:** `makeRequest(validBody)`
- **Expected:**
  - `res.status === 200`
  - `body.fallback === true`
  - `body.fallbackReason` contém "não retornou sugestões"
  - `body.suggestions.length > 0`

---

### T-R07: retorna 400 para violação de Zod schema

- **Setup:** `createUserWithApiKey("r07@test.com")`
- **Input:** `makeRequest({ columnsMeta: [], sampleRows: [] })` (`columnsMeta.min(1)` violado)
- **Expected:**
  - `res.status === 400`
  - `body.error` contém "Dados inválidos"

---

## 7. Testes de Componente: `ChartSuggestionSelector`

**Arquivo:** `tests/components/ChartSuggestionSelector.test.tsx`

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChartSuggestionSelector } from "@/components/ai/ChartSuggestionSelector";
import { mockAISuggestions } from "../fixtures/m08";
import type { ChartSuggestion } from "@/types/spreadsheet";

// Sugestões extras para testar limite de 4
const fiveSuggestions: ChartSuggestion[] = [
  ...mockAISuggestions,
  {
    type: "barHorizontal",
    xKey: "margem",
    yKey: "região",
    title: "Margem por Região",
    rationale: "Sugestão extra 1.",
    priority: 4,
  },
  {
    type: "table",
    xKey: "data",
    title: "Dados Completos",
    rationale: "Sugestão extra 2.",
    priority: 5,
  },
];
```

---

### T-C01: renderiza todas as sugestões recebidas com título e rationale

- **Setup:**
  ```typescript
  render(<ChartSuggestionSelector suggestions={mockAISuggestions} loading={false} onConfirm={vi.fn()} />)
  ```
- **Expected:**
  - 3 cards renderizados
  - Texto "Total de Vendas por Região" visível
  - Texto "Evolução de Vendas ao Longo do Tempo" visível
  - Texto "Distribuição por Região" visível
  - Textos de `rationale` visíveis no DOM

---

### T-C02: estado de loading exibe skeletons, não os cards de sugestão

- **Setup:**
  ```typescript
  render(<ChartSuggestionSelector suggestions={[]} loading={true} onConfirm={vi.fn()} />)
  ```
- **Expected:**
  - Elementos com `data-testid="suggestion-skeleton"` presentes (quantidade: 4)
  - Nenhum dos títulos de sugestão presente no DOM

---

### T-C03: selecionar um item atualiza o contador corretamente

- **Setup:** Renderizar com `mockAISuggestions` e `loading=false`
- **Ação:** `fireEvent.click` no primeiro card ou seu checkbox
- **Expected:**
  - Texto "1 de 4 selecionados" visível
  - Primeiro card tem atributo ou classe indicando selecionado

---

### T-C04: máximo de 4 seleções — 5º checkbox fica disabled

- **Setup:** Renderizar com `fiveSuggestions` (5 itens)
- **Ações:** Clicar nos 4 primeiros cards sequencialmente
- **Expected:**
  - Texto "4 de 4 selecionados" visível
  - Botão "Gerar dashboard" habilitado (`not.toBeDisabled()`)
  - O 5º checkbox está `disabled`

---

### T-C05: desmarcar uma seleção reabilita checkboxes desabilitados

- **Setup:** Idem T-C04 com 4 selecionados
- **Ação:** Clicar no 1º card para desmarcar
- **Expected:**
  - Texto "3 de 4 selecionados"
  - O 5º checkbox volta a estar habilitado (`not.toBeDisabled()`)

---

### T-C06: botão "Confirmar" chama `onConfirm` com os itens selecionados

- **Setup:** Renderizar com `mockAISuggestions`, selecionar 2 itens (1º e 2º)
- **Ação:** Clicar no botão de confirmação
- **Expected:**
  - `onConfirm` chamado 1 vez
  - Argumento é array com exatamente os 2 itens selecionados
  - Os itens correspondem às sugestões `bar` e `line`

---

### T-C07: botão "Confirmar" fica disabled quando 0 itens selecionados

- **Setup:**
  ```typescript
  const onConfirm = vi.fn();
  render(<ChartSuggestionSelector suggestions={mockAISuggestions} loading={false} onConfirm={onConfirm} />)
  ```
- **Expected:**
  - Botão de confirmação tem atributo `disabled`
  - `onConfirm` não foi chamado
  - Tentar clicar no botão não chama `onConfirm`

---

## 8. Testes de Integração: Fluxo Completo

**Arquivo:** `tests/integration/uploadSuggestFlow.test.ts`

Testes E2E que exercitam a rota API + DB real (sem chamar provider de IA externo).

### Setup base

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { users, reports } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { lucia } from "@/lib/auth/lucia";
import { encryptApiKey } from "@/lib/crypto/apiKey";
import { buildChartFromSuggestion } from "@/lib/chartEngine";
import { sampleColumnsMeta, sampleRows, mockAISuggestions } from "../fixtures/m08";

vi.mock("@/lib/ai/suggestCharts", () => ({
  suggestChartsWithAI: vi.fn(),
}));

const mockSet = vi.fn();
const mockGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => ({ set: mockSet, get: mockGet }),
}));

const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");

function makePostRequest(url: string, body: unknown) {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
```

---

### T-I01: fluxo completo — usuário com chave recebe sugestões e salva relatório

- **Setup:**
  1. Criar usuário com `aiApiKey` e `aiProvider = "openai"` no banco
  2. `vi.mocked(suggestChartsWithAI).mockResolvedValue(mockAISuggestions)`
  3. Criar sessão; configurar `mockGet` com o session ID
- **Ações:**
  1. `POST /api/ai-chart-suggestions` com `sampleColumnsMeta` e `sampleRows`
  2. Pegar `suggestions[0]` (bar chart) da resposta
  3. `const chartConfig = buildChartFromSuggestion(suggestions[0], sampleRows)`
  4. `POST /api/reports` com `{ fileName: "test.csv", rowCount: 3, columnsMeta: sampleColumnsMeta, chartsConfig: [chartConfig] }`
- **Expected:**
  - Passo 1: `status 200`, `body.fallback === false`, `body.suggestions.length === 3`
  - Passo 4: `status 200`, `body.id` é número positivo
  - DB: `SELECT * FROM reports WHERE id = body.id` retorna 1 linha com `charts_config` contendo o gráfico de barras
  - Body de nenhuma resposta contém `"sk-"`

---

### T-I02: fluxo de fallback — IA falha, relatório salvo com gráficos automáticos

- **Setup:**
  1. Criar usuário com chave
  2. `vi.mocked(suggestChartsWithAI).mockRejectedValue(new Error("503 Service Unavailable"))`
- **Ações:**
  1. `POST /api/ai-chart-suggestions` com `sampleColumnsMeta` e `sampleRows`
  2. Verificar body (fallback ativado)
  3. Usar `suggestions[0]` do fallback para construir um ChartConfig
  4. `POST /api/reports` com o ChartConfig construído
- **Expected:**
  - Passo 1: `status 200`, `body.fallback === true`, `body.fallbackReason` contém "503"
  - `body.suggestions.length > 0` (engine determinístico gerou ao menos 1 sugestão)
  - Passo 4: `status 200`, relatório salvo com sucesso no DB

---

### T-I03: sem chave — rota retorna 400

- **Setup:** Criar usuário sem `aiApiKey` (campos `null` no banco)
- **Ações:**
  1. `POST /api/ai-chart-suggestions` com dados válidos
- **Expected:**
  - `status 400`
  - `body.error` contém "Chave de API não configurada"
  - `suggestChartsWithAI` não foi chamado

---

## 9. Padrões de Teste a Seguir

### Mock de IA — sempre obrigatório

Nunca chamar provider de IA real. Sempre mockar via:

```typescript
vi.mock("@/lib/ai/suggestCharts", () => ({
  suggestChartsWithAI: vi.fn(),
}));
```

Ou para testes unitários da própria `suggestCharts.ts`:

```typescript
vi.mock("ai", () => ({ generateText: vi.fn() }));
```

### Import dinâmico da route (padrão do projeto)

Para testes de integração que importam o handler da rota, usar `await import()` dentro do `it()` após configurar todos os mocks:

```typescript
it("retorna 200 com sugestões", async () => {
  mockGet.mockReturnValue({ value: sessionId });
  vi.mocked(suggestChartsWithAI).mockResolvedValue(mockAISuggestions);
  const { POST } = await import("@/app/api/ai-chart-suggestions/route");
  const res = await POST(makeRequest(validBody));
  // assertions
});
```

### Asserção de segurança — em todo teste que retorna dados

Em qualquer teste que lida com resposta de API, adicionar:

```typescript
const rawBody = JSON.stringify(await res.clone().json());
expect(rawBody).not.toContain("sk-");
expect(rawBody).not.toContain("apiKey");
expect(rawBody).not.toContain("ai_api_key");
```

### Limpeza do banco

O `tests/setup.ts` existente já limpa `reports`, `sessions` e `users` no `beforeEach`. Nenhum `afterEach` adicional é necessário.

### Nomenclatura de testes — em pt-BR

Seguir o padrão existente no projeto:

```typescript
it("retorna 401 sem sessão válida", ...)
it("descarta sugestões com colunas inexistentes", ...)
it("fallback ocorre quando IA lança erro de timeout", ...)
it("botão confirmar fica disabled quando nenhum item está selecionado", ...)
```

### Não testar implementação interna do prompt

Os testes **não** devem verificar o conteúdo exato do system prompt ou do user prompt enviado à IA. Testar apenas o comportamento observável (resposta processada, erros lançados, itens descartados). A lógica interna do prompt é melhor validada através de testes manuais com providers reais.
