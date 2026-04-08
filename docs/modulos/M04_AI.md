# M04 — Análise de IA

**Status:** 🚧 Em desenvolvimento

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/lib/ai/analyze.ts` | Chamada multi-provider via Vercel AI SDK |
| `src/lib/crypto/apiKey.ts` | Decrypt da API Key antes de usar |
| `src/app/api/ai-analyze/route.ts` | API Route que orquestra a análise |
| `src/components/ai/InsightsPanel.tsx` | Painel de exibição dos insights (Markdown) |

---

## Providers suportados

| Provider | ID no banco | Modelo padrão |
|---------|-------------|--------------|
| OpenAI | `openai` | `gpt-4o-mini` |
| Anthropic | `anthropic` | `claude-3-haiku-20240307` |
| Google | `google` | `gemini-1.5-flash` |
| Groq | `groq` | `llama-3.1-8b-instant` |

---

## API Route (`src/app/api/ai-analyze/route.ts`)

```ts
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { decryptApiKey } from "@/lib/crypto/apiKey";
import { analyzeSpreadsheet } from "@/lib/ai/analyze";
import { validateSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  fileName:  z.string(),
  rowCount:  z.number().int().positive(),
  columns:   z.array(z.unknown()),
  sample:    z.array(z.record(z.unknown())).max(50),
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

  // Decripta apenas em memória — nunca loga, nunca retorna
  const apiKey = decryptApiKey(userData.aiApiKey);

  const insights = await analyzeSpreadsheet({
    provider:  userData.aiProvider,
    apiKey,                          // descartado após esta chamada
    fileName:  parsed.data.fileName,
    rowCount:  parsed.data.rowCount,
    columns:   parsed.data.columns as ColumnMeta[],
    sample:    parsed.data.sample,
  });

  return Response.json({ insights });
}
```

---

## Crypto (`src/lib/crypto/apiKey.ts`)

```ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32 bytes

export function encryptApiKey(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptApiKey(stored: string): string {
  const [ivHex, tagHex, dataHex] = stored.split(":");
  const iv   = Buffer.from(ivHex,  "hex");
  const tag  = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex,"hex");
  const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final("utf8");
}
```

**Regras absolutas:**
- `ENCRYPTION_KEY` nunca vai ao cliente (nunca em `NEXT_PUBLIC_*`)
- Decriptografar apenas dentro de API Routes, nunca em componentes
- Nunca logar `apiKey`, nem `plaintext`, nem `stored`
- Nunca retornar a key em resposta — apenas `hasApiKey: boolean`

---

## Prompt Template

```
Você é um analista de dados de negócios.

Planilha: "{fileName}" ({rowCount} linhas)
Colunas detectadas:
{colDesc}

Amostra ({n} linhas):
{JSON.stringify(sample)}

Forneça em Markdown:
1. **Resumo executivo** (2-3 frases)
2. **Insights de negócio** (3-5 pontos)
3. **Anomalias detectadas** (se houver)
4. **Métricas sugeridas para acompanhar**

Responda em português.
```

---

## InsightsPanel (`components/ai/InsightsPanel.tsx`)

- Renderiza o Markdown retornado pela API
- Usar `react-markdown` ou equivalente para renderização segura
- Exibir skeleton enquanto aguarda resposta
- Se usuário não tem API Key: mostrar card com instrução para configurar, não bloquear o dashboard
