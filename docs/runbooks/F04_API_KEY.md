# F04 — Configuração de API Key de IA

**Rotas:** `GET /api/user/api-key` e `POST /api/user/api-key`
**Componente:** `components/modals/ApiKeyModal.tsx`
**Testes:** [T04_API_KEY.md](../testes/T04_API_KEY.md)

---

## Fluxo — primeira sessão

```
(app)/layout.tsx carrega
  │  GET /api/user/api-key → { hasApiKey: false, aiProvider: null }
  │
  ▼ hasApiKey === false
ApiKeyModal abre automaticamente
  │
  │  Usuário seleciona provider + digita API Key
  │  [Salvar] → POST /api/user/api-key
  │     │  encryptApiKey(plaintext) → AES-256-GCM
  │     │  db.update(users).set({ aiProvider, aiApiKey: encrypted })
  │     ▼
  │  Modal fecha — não reabre na mesma sessão
  │
  │  [Ignorar] → Modal fecha, usuário usa sem IA
  ▼
Dashboard disponível
```

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/app/api/user/api-key/route.ts` | GET + POST |
| `src/components/modals/ApiKeyModal.tsx` | Modal de configuração |
| `src/lib/crypto/apiKey.ts` | `encryptApiKey` / `decryptApiKey` |
| `src/app/(app)/layout.tsx` | Dispara o modal na primeira sessão |

---

## Código — API Route

```ts
// src/app/api/user/api-key/route.ts
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { encryptApiKey } from "@/lib/crypto/apiKey";
import { validateSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { z } from "zod";

// GET — nunca retorna a key, apenas hasApiKey + provider
export async function GET(req: Request) {
  const { user } = await validateSession(req);

  const [row] = await db.select({
    aiApiKey:   users.aiApiKey,
    aiProvider: users.aiProvider,
  }).from(users).where(eq(users.id, user.id));

  return Response.json({
    hasApiKey:  !!row.aiApiKey,
    aiProvider: row.aiProvider,
  });
}

// POST — salva key criptografada
const schema = z.object({
  provider: z.enum(["openai", "anthropic", "google", "groq"]),
  apiKey:   z.string().min(10),
});

export async function POST(req: Request) {
  const { user } = await validateSession(req);
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });

  const { provider, apiKey } = parsed.data;
  const encrypted = encryptApiKey(apiKey); // AES-256-GCM

  await db.update(users)
    .set({ aiProvider: provider, aiApiKey: encrypted })
    .where(eq(users.id, user.id));

  return Response.json({ ok: true });
}
```

---

## Código — Criptografia (`src/lib/crypto/apiKey.ts`)

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

---

## Regras de negócio

1. **GET nunca retorna a key** — apenas `{ hasApiKey: boolean, aiProvider: string | null }`
2. Key decriptografada **apenas em memória** durante uso na análise de IA — nunca em log, resposta ou cache
3. `user.id` sempre da sessão — nunca do body
4. Modal aparece **apenas uma vez** por sessão (não por login) — controlar com state no layout
5. Usuário pode atualizar a key a qualquer momento via settings (mesmo endpoint POST)
6. `ENCRYPTION_KEY` nunca em variáveis `NEXT_PUBLIC_*`
