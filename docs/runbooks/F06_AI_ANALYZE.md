# F06 — Análise de IA

**Rota:** `POST /api/ai-analyze`
**Componente:** `components/ai/InsightsPanel.tsx`
**Testes:** [T06_AI_ANALYZE.md](../testes/T06_AI_ANALYZE.md)

---

## Fluxo

```
Dashboard gerado (após F05)
  │  Se hasApiKey === true → disparar análise automática
  │
  ▼
POST /api/ai-analyze
  │  validateSession() → user.id
  │  Buscar ai_provider + ai_api_key do banco
  │  Se null → 400 "Configure sua API Key de IA"
  │  decryptApiKey(stored) → plaintext (em memória)
  │  Construir modelo via Vercel AI SDK
  │  Enviar prompt com metadados + amostra (≤ 50 linhas)
  │  generateText() → Markdown com insights
  │  Descartar key da memória
  ▼
InsightsPanel renderiza o Markdown
```

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/app/api/ai-analyze/route.ts` | Endpoint de análise |
| `src/lib/ai/analyze.ts` | Chamada multi-provider |
| `src/lib/crypto/apiKey.ts` | `decryptApiKey` |
| `src/components/ai/InsightsPanel.tsx` | Exibição dos insights |

---

## Providers suportados

| Provider | ID | Modelo padrão |
|---------|-----|--------------|
| OpenAI | `openai` | `gpt-4o-mini` |
| Anthropic | `anthropic` | `claude-3-haiku-20240307` |
| Google | `google` | `gemini-1.5-flash` |
| Groq | `groq` | `llama-3.1-8b-instant` |

---

## Código — API Route

```ts
// src/app/api/ai-analyze/route.ts
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { decryptApiKey } from "@/lib/crypto/apiKey";
import { analyzeSpreadsheet } from "@/lib/ai/analyze";
import { validateSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  fileName: z.string(),
  rowCount: z.number().int().positive(),
  columns:  z.array(z.unknown()),
  sample:   z.array(z.record(z.unknown())).max(50),
});

export async function POST(req: Request) {
  const { user } = await validateSession(req);

  const [userData] = await db.select({
    aiProvider: users.aiProvider,
    aiApiKey:   users.aiApiKey,
  }).from(users).where(eq(users.id, user.id));

  if (!userData.aiApiKey || !userData.aiProvider) {
    return Response.json(
      { error: "Configure sua API Key de IA nas configurações antes de usar esta funcionalidade." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });

  // Decripta APENAS em memória — nunca loga, nunca retorna
  const apiKey = decryptApiKey(userData.aiApiKey);

  const insights = await analyzeSpreadsheet({
    provider:  userData.aiProvider,
    apiKey,
    fileName:  parsed.data.fileName,
    rowCount:  parsed.data.rowCount,
    columns:   parsed.data.columns as ColumnMeta[],
    sample:    parsed.data.sample,
  });

  return Response.json({ insights });
}
```

## Código — Lib de análise

```ts
// src/lib/ai/analyze.ts
import { generateText } from "ai";
import { createOpenAI }              from "@ai-sdk/openai";
import { createAnthropic }           from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI }  from "@ai-sdk/google";
import { createGroq }                from "@ai-sdk/groq";

export async function analyzeSpreadsheet({ provider, apiKey, fileName, rowCount, columns, sample }) {
  const modelMap = {
    openai:    () => createOpenAI({ apiKey })("gpt-4o-mini"),
    anthropic: () => createAnthropic({ apiKey })("claude-3-haiku-20240307"),
    google:    () => createGoogleGenerativeAI({ apiKey })("gemini-1.5-flash"),
    groq:      () => createGroq({ apiKey })("llama-3.1-8b-instant"),
  };

  const model = modelMap[provider]?.();
  if (!model) throw new Error(`Provider desconhecido: ${provider}`);

  const colDesc = columns.map(c => `- ${c.name} (${c.type}): únicos=${c.stats.uniqueCount}`).join("\n");

  const { text } = await generateText({
    model,
    prompt: `Você é um analista de dados de negócios.\n\nPlanilha: "${fileName}" (${rowCount} linhas)\nColunas:\n${colDesc}\n\nAmostra (${sample.length} linhas):\n${JSON.stringify(sample)}\n\nForneça em Markdown:\n1. **Resumo executivo** (2-3 frases)\n2. **Insights de negócio** (3-5 pontos)\n3. **Anomalias detectadas** (se houver)\n4. **Métricas sugeridas para acompanhar**\n\nResponda em português.`,
  });

  return text;
}
```

---

## Regras de negócio

1. Máximo **50 linhas** enviadas ao provider (`AI_SAMPLE_ROWS`) — nunca a planilha completa
2. Key decriptografada **apenas em memória** durante a chamada — descartada após
3. Se `ai_api_key` é null → `400` com mensagem amigável — não bloqueia o dashboard
4. Se usuário não tem key → `InsightsPanel` exibe card com instrução para configurar
5. Nunca logar `apiKey`, nem antes nem depois da chamada
