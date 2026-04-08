# Visão Geral da Arquitetura — PlanilhaDash

## Stack e responsabilidades

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER                                                        │
│                                                                 │
│  Next.js 14 App Router (React 18 + TypeScript 5)               │
│  ├── (auth)/*   — páginas públicas                              │
│  ├── (app)/*    — páginas protegidas                            │
│  └── api/*      — API Routes (server-side)                      │
│                                                                 │
│  UI: shadcn/ui + Tailwind CSS 3                                 │
│  Gráficos: Recharts 2                                           │
│  PDF: html2canvas + jsPDF (client-side)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (cookies)
┌──────────────────────────▼──────────────────────────────────────┐
│  SERVER (Next.js API Routes)                                    │
│                                                                 │
│  Auth: Lucia Auth v3 + bcrypt (custo 12)                        │
│  Banco: Drizzle ORM 0.36 → MariaDB 10.11                        │
│  Crypto: AES-256-GCM (src/lib/crypto/apiKey.ts)                 │
│  Parser: SheetJS 0.20 + PapaParse 5                             │
│  IA: Vercel AI SDK v5 (multi-provider)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  BANCO DE DADOS                                                 │
│  MariaDB 10.11                                                  │
│  Tabelas: users · sessions · reports                            │
│  Drizzle Kit para migrations                                    │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  PROVEDORES EXTERNOS (opcional, key do próprio usuário)         │
│  OpenAI API · Anthropic API · Google AI · Groq API              │
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo principal de uso

```
1. Usuário acessa → middleware verifica sessão
2. Sem sessão → /login → POST /api/auth/login → session cookie
3. Com sessão → /upload → seleciona arquivo → parse client-side
4. inferTypes() classifica colunas → chartEngine() seleciona gráficos
5. Dashboard renderizado com Recharts
6. Opcional: POST /api/ai-analyze → decripta key → Vercel AI SDK → insights
7. POST /api/reports → salva no banco
8. /dashboard lista relatórios do usuário
```

## Princípios de design

- **Segurança first:** API Keys nunca em plaintext, nunca em logs, nunca no cliente
- **Server-side validation:** Zod em todas as API Routes — nunca confiar no cliente
- **Session-based auth:** user_id sempre da sessão do servidor, nunca do request body
- **Bring Your Own Key:** cada usuário usa sua própria chave de IA — sem custo centralizado
- **Parsing client-side:** SheetJS e PapaParse rodam no browser — sem upload raw para o servidor para parsing
- **Persistência mínima:** apenas metadados no banco — arquivo original fica em disco, nunca em DB

## Localização dos módulos-chave

| Módulo | Caminho |
|--------|---------|
| Auth (Lucia) | `src/lib/auth/lucia.ts` |
| Hash de senha | `src/lib/auth/password.ts` |
| Drizzle client | `src/lib/db/index.ts` |
| Schema Drizzle | `src/lib/db/schema.ts` |
| Criptografia | `src/lib/crypto/apiKey.ts` |
| Análise de IA | `src/lib/ai/analyze.ts` |
| Parser entry | `src/lib/parser/index.ts` |
| Parser XLSX | `src/lib/parser/xlsxParser.ts` |
| Parser CSV | `src/lib/parser/csvParser.ts` |
| Inferência tipos | `src/lib/inferTypes.ts` |
| Chart engine | `src/lib/chartEngine.ts` |
| Export PDF | `src/lib/pdfExport.ts` |
| Tipos globais | `src/types/spreadsheet.ts` |
| Middleware | `src/middleware.ts` |
