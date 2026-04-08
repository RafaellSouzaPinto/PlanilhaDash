# Mapa Completo de Rotas — PlanilhaDash

## Rotas de Página (App Router)

| Rota | Arquivo | Auth | Descrição |
|------|---------|:----:|-----------|
| `/` | `app/page.tsx` | Não | Redirect → `/dashboard` se autenticado, senão `/login` |
| `/login` | `app/(auth)/login/page.tsx` | Não | Formulário de login |
| `/signup` | `app/(auth)/signup/page.tsx` | Não | Formulário de cadastro |
| `/dashboard` | `app/(app)/dashboard/page.tsx` | Sim | Histórico de relatórios |
| `/upload` | `app/(app)/upload/page.tsx` | Sim | Upload de planilha + geração de dashboard |
| `/reports/[id]` | `app/(app)/reports/[id]/page.tsx` | Sim | Visualizar relatório salvo |

## API Routes

| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| POST | `/api/auth/signup` | Não | Criar conta |
| POST | `/api/auth/login` | Não | Login — retorna session cookie |
| POST | `/api/auth/logout` | Sim | Invalidar sessão |
| GET | `/api/user/api-key` | Sim | `{ hasApiKey, aiProvider }` — nunca retorna a key |
| POST | `/api/user/api-key` | Sim | Salvar API Key criptografada |
| GET | `/api/reports` | Sim | Listar relatórios do usuário |
| POST | `/api/reports` | Sim | Salvar novo relatório |
| GET | `/api/reports/[id]` | Sim | Buscar relatório (valida ownership) |
| POST | `/api/ai-analyze` | Sim | Analisar planilha com IA |

## Grupos de Rotas (Route Groups)

```
app/
├── page.tsx                        ← redirect inteligente
├── (auth)/                         ← rotas públicas (sem Header)
│   ├── layout.tsx                  ← layout minimalista
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (app)/                          ← rotas protegidas
│   ├── layout.tsx                  ← verifica sessão + Header
│   ├── dashboard/page.tsx
│   ├── upload/page.tsx
│   └── reports/[id]/page.tsx
└── api/
    ├── auth/
    │   ├── signup/route.ts
    │   ├── login/route.ts
    │   └── logout/route.ts
    ├── user/
    │   └── api-key/route.ts
    ├── reports/
    │   ├── route.ts                ← GET + POST
    │   └── [id]/route.ts           ← GET
    └── ai-analyze/route.ts
```

## Middleware (`src/middleware.ts`)

```ts
// Padrão de proteção de rotas
export const config = {
  matcher: ["/(app)/:path*"],
};
```

- Rota sem sessão válida → redirect para `/login`
- Rota `/login` ou `/signup` com sessão válida → redirect para `/dashboard`
