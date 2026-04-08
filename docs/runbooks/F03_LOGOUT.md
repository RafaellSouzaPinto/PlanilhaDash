# F03 — Logout

**Rota:** `POST /api/auth/logout`
**Testes:** [T03_LOGOUT.md](../testes/T03_LOGOUT.md)

---

## Fluxo

```
Usuário clica em "Sair" (DropdownMenu no Header)
  │
  ▼
POST /api/auth/logout
  │  Lê sessionId do cookie
  │  lucia.invalidateSession(sessionId) → remove do banco
  │  Cria cookie em branco para sobrescrever
  ▼
Redirect para /login
```

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/app/api/auth/logout/route.ts` | Invalidação de sessão |
| `src/app/(app)/layout.tsx` | Botão de logout no Header |
| `src/lib/auth/lucia.ts` | `invalidateSession` |

---

## Código — API Route

```ts
// src/app/api/auth/logout/route.ts
import { lucia } from "@/lib/auth/lucia";
import { cookies } from "next/headers";

export async function POST() {
  const sessionId = cookies().get(lucia.sessionCookieName)?.value;
  if (!sessionId) return Response.json({ ok: true });

  await lucia.invalidateSession(sessionId);

  const blankCookie = lucia.createBlankSessionCookie();
  cookies().set(blankCookie.name, blankCookie.value, blankCookie.attributes);

  return Response.json({ ok: true });
}
```

---

## Regras de negócio

1. `lucia.invalidateSession()` **remove a linha da tabela `sessions`** — não apenas apaga o cookie
2. Se não há sessionId no cookie → retornar 200 sem erro (logout idempotente)
3. Após logout, qualquer acesso a rota `(app)/*` deve redirecionar para `/login` (via middleware)
4. Sessões expiradas são limpas automaticamente pelo Lucia — não há necessidade de cron job no MVP
