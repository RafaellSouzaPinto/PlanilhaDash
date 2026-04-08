# M01 — Autenticação

**Status:** 🚧 Em desenvolvimento
**Módulo:** Lucia Auth v3 + bcrypt + Drizzle + MariaDB

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/lib/auth/lucia.ts` | Configuração do Lucia Auth + adapter Drizzle |
| `src/lib/auth/password.ts` | Helpers bcrypt (hash + compare) |
| `src/lib/auth/session.ts` | Helper `validateSession()` usado nas API Routes |
| `src/lib/db/schema.ts` | Tabelas `users` e `sessions` |
| `src/middleware.ts` | Proteção de rotas `(app)/*` |
| `src/app/api/auth/signup/route.ts` | POST signup |
| `src/app/api/auth/login/route.ts` | POST login |
| `src/app/api/auth/logout/route.ts` | POST logout |
| `src/app/(auth)/login/page.tsx` | Página de login |
| `src/app/(auth)/signup/page.tsx` | Página de cadastro |
| `src/components/auth/LoginForm.tsx` | Formulário de login |
| `src/components/auth/SignupForm.tsx` | Formulário de cadastro |

---

## Configuração Lucia Auth (`src/lib/auth/lucia.ts`)

```ts
import { Lucia } from "lucia";
import { DrizzleMySQLAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";

const adapter = new DrizzleMySQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attrs) => ({
    name:       attrs.name,
    email:      attrs.email,
    aiProvider: attrs.ai_provider,
    hasApiKey:  !!attrs.ai_api_key,
  }),
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      name:        string;
      email:       string;
      ai_provider: string | null;
      ai_api_key:  string | null;
    };
  }
}
```

---

## Helper de Sessão (`src/lib/auth/session.ts`)

```ts
import { lucia } from "./lucia";
import { cookies } from "next/headers";

export async function validateSession(req?: Request) {
  const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) throw new Response("Unauthorized", { status: 401 });

  const { session, user } = await lucia.validateSession(sessionId);
  if (!session) throw new Response("Unauthorized", { status: 401 });

  return { session, user };
}
```

---

## Middleware (`src/middleware.ts`)

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { lucia } from "@/lib/auth/lucia";

export async function middleware(request: NextRequest) {
  const sessionId = request.cookies.get(lucia.sessionCookieName)?.value;

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
                      request.nextUrl.pathname.startsWith("/signup");

  if (!sessionId) {
    if (isAuthRoute) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { session } = await lucia.validateSession(sessionId);

  if (!session) {
    if (isAuthRoute) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## Regras de negócio

1. Email é único — verificar antes de inserir (409 se duplicado)
2. Senha mínimo 8 caracteres
3. Hash com bcrypt custo 12 — nunca menos
4. Erro de login sempre "Credenciais inválidas" — nunca diferenciar email/senha para o usuário
5. Logout invalida sessão no banco (`lucia.invalidateSession`) — não apenas apaga cookie
6. `user_id` de operações autenticadas **sempre** vem da sessão — nunca do body

---

## Testes relacionados

Ver [../testes/T01_AUTH.md](../testes/T01_AUTH.md)
