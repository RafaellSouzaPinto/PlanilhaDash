# F02 — Login

**Rota:** `POST /api/auth/login`
**Página:** `(auth)/login/page.tsx`
**Componente:** `components/auth/LoginForm.tsx`
**Testes:** [T02_LOGIN.md](../testes/T02_LOGIN.md)

---

## Fluxo

```
LoginForm
  │  onSubmit(email, password)
  ▼
POST /api/auth/login
  │  Validar com Zod
  │  Buscar usuário por email → 401 "Credenciais inválidas" se não existe
  │  bcrypt.compare(password, passwordHash)
  │  → 401 "Credenciais inválidas" se senha errada
  │  lucia.createSession(userId)
  │  cookies().set(sessionCookie)
  ▼
Redirect para /dashboard
```

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/app/api/auth/login/route.ts` | Lógica do endpoint |
| `src/app/(auth)/login/page.tsx` | Página de login |
| `src/components/auth/LoginForm.tsx` | Formulário |
| `src/lib/auth/lucia.ts` | Criação da sessão |

---

## Código — API Route

```ts
// src/app/api/auth/login/route.ts
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { lucia } from "@/lib/auth/lucia";
import { compare } from "bcrypt";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });

  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) return Response.json({ error: "Credenciais inválidas" }, { status: 401 });

  const valid = await compare(password, user.passwordHash);
  if (!valid) return Response.json({ error: "Credenciais inválidas" }, { status: 401 });

  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  return Response.json({ ok: true });
}
```

---

## Regras de negócio

1. Mensagem de erro **sempre** "Credenciais inválidas" — nunca revelar se é email ou senha errada
2. Cookie de sessão `httpOnly`, `secure: true` em produção
3. Sessão persiste após fechar e reabrir o browser (cookie persistente, não de sessão)
4. Não limitar tentativas no MVP — implementar rate limiting em versões futuras
