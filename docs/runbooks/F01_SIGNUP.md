# F01 — Signup (Cadastro de Usuário)

**Rota:** `POST /api/auth/signup`
**Página:** `(auth)/signup/page.tsx`
**Componente:** `components/auth/SignupForm.tsx`
**Testes:** [T01_SIGNUP.md](../testes/T01_SIGNUP.md)

---

## Fluxo

```
SignupForm
  │  onSubmit(name, email, password)
  ▼
POST /api/auth/signup
  │  Validar com Zod (name min 2, email válido, password min 8)
  │  Verificar email único → 409 se duplicado
  │  bcrypt.hash(password, 12)
  │  db.insert(users)
  │  lucia.createSession(userId)
  │  cookies().set(sessionCookie)
  ▼
Redirect para /dashboard
```

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/app/api/auth/signup/route.ts` | Lógica do endpoint |
| `src/app/(auth)/signup/page.tsx` | Página de cadastro |
| `src/components/auth/SignupForm.tsx` | Formulário com validação client-side |
| `src/lib/auth/lucia.ts` | Criação da sessão |
| `src/lib/db/schema.ts` | Tabela `users` |

---

## Código — API Route

```ts
// src/app/api/auth/signup/route.ts
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { lucia } from "@/lib/auth/lucia";
import { hash } from "bcrypt";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";

const schema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });

  const { name, email, password } = parsed.data;

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return Response.json({ error: "Email já cadastrado" }, { status: 409 });

  const passwordHash = await hash(password, 12);
  const [user] = await db.insert(users).values({ name, email, passwordHash }).$returningId();

  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  return Response.json({ ok: true });
}
```

---

## Regras de negócio

1. Email único — verificar antes de inserir → 409 se duplicado
2. Senha mínimo 8 caracteres — validado via Zod
3. Hash bcrypt custo **12** — nunca menos
4. Sessão criada imediatamente após cadastro (usuário já entra logado)
5. `userId` nunca vem do body — criado pelo banco e usado internamente
