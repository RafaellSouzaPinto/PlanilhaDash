# Skill: Next.js 14 (App Router)

**Projeto:** PlanilhaDash
**Versão:** Next.js 14.x com TypeScript 5.x

---

## Estrutura de pastas (App Router)

```
src/app/
├── layout.tsx              ← layout raiz (html, body, providers)
├── page.tsx                ← redirect inteligente
├── (auth)/                 ← route group público (sem Header)
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (app)/                  ← route group protegido
│   ├── layout.tsx          ← verifica sessão + Header
│   ├── dashboard/page.tsx
│   ├── upload/page.tsx
│   └── reports/[id]/page.tsx
└── api/                    ← API Routes (server-side)
    ├── auth/signup/route.ts
    ├── auth/login/route.ts
    ├── auth/logout/route.ts
    ├── user/api-key/route.ts
    ├── reports/route.ts
    ├── reports/[id]/route.ts
    └── ai-analyze/route.ts
```

---

## Padrões obrigatórios

### API Routes

```ts
// ✅ Correto — sempre retornar Response.json()
export async function POST(req: Request) {
  // validar → processar → retornar
  return Response.json({ ok: true });
}

// ✅ Buscar sessão sempre pelo cookie, nunca do body
const { user } = await validateSession(req);

// ✅ Validar body com Zod antes de usar
const parsed = schema.safeParse(await req.json());
if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });
```

### Server Components vs Client Components

```ts
// Padrão: Server Component (sem "use client") — fetch de dados, acesso ao banco
export default async function DashboardPage() {
  const reports = await fetchReports(); // server-side
  return <ReportsList reports={reports} />;
}

// Client Component — interatividade, hooks, eventos
"use client";
export function Dropzone({ onDrop }: Props) {
  const [file, setFile] = useState<File | null>(null);
  // ...
}
```

### Middleware

- Localização: `src/middleware.ts` (raiz do src)
- Usar `matcher` para limitar escopo
- Não fazer lógica pesada no middleware (apenas validação de sessão e redirect)

### Rotas dinâmicas

```ts
// src/app/api/reports/[id]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const reportId = Number(params.id);
  // ...
}
```

---

## Proibições

- Nunca usar `pages/` — apenas `app/`
- Nunca usar `getServerSideProps` ou `getStaticProps` — App Router não usa
- Nunca fazer fetch ao banco em Client Components — apenas em Server Components ou API Routes
- Nunca expor `ENCRYPTION_KEY` em variáveis `NEXT_PUBLIC_*`
- Nunca usar `any` — especialmente em `params` e `searchParams`
