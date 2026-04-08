# F07 — Salvar e Visualizar Relatório

**Rotas:** `POST /api/reports` · `GET /api/reports` · `GET /api/reports/[id]`
**Páginas:** `(app)/dashboard/page.tsx` · `(app)/reports/[id]/page.tsx`
**Testes:** [T07_SAVE_REPORT.md](../testes/T07_SAVE_REPORT.md)

---

## Fluxo — salvar

```
Dashboard gerado (após F05 + F06)
  │  Usuário clica [Salvar]
  ▼
POST /api/reports
  │  validateSession() → user.id
  │  Validar body com Zod
  │  db.insert(reports) com userId da sessão
  ▼
Redirect para /reports/{id} ou atualizar URL
```

## Fluxo — listar (histórico)

```
GET /dashboard
  │
  ▼
GET /api/reports
  │  validateSession() → user.id
  │  SELECT id, fileName, rowCount, createdAt WHERE userId = user.id ORDER BY createdAt DESC
  ▼
Grid de cards de relatório
```

## Fluxo — visualizar

```
GET /reports/[id]
  │
  ▼
GET /api/reports/[id]
  │  validateSession() → user.id
  │  SELECT * WHERE id = reportId LIMIT 1
  │  Verificar report.userId === user.id → 403 se diferente
  ▼
Reconstrói dashboard a partir de columns_meta + charts_config
Exibe ai_insights se não null
```

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/app/api/reports/route.ts` | GET (listar) + POST (salvar) |
| `src/app/api/reports/[id]/route.ts` | GET (buscar por ID) |
| `src/app/(app)/dashboard/page.tsx` | Histórico de relatórios |
| `src/app/(app)/reports/[id]/page.tsx` | Visualização de relatório salvo |

---

## Código — POST (salvar)

```ts
const schema = z.object({
  fileName:     z.string(),
  rowCount:     z.number().int().positive(),
  columnsMeta:  z.array(z.unknown()),
  chartsConfig: z.array(z.unknown()),
  aiInsights:   z.string().nullable().optional(),
  pdfPath:      z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const { user } = await validateSession(req);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Dados inválidos" }, { status: 400 });

  const [report] = await db.insert(reports).values({
    userId: user.id,   // SEMPRE da sessão
    ...parsed.data,
  }).$returningId();

  return Response.json({ id: report.id });
}
```

## Código — GET por ID (com verificação de ownership)

```ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { user } = await validateSession(req);
  const [report] = await db.select().from(reports).where(eq(reports.id, Number(params.id))).limit(1);

  if (!report) return Response.json({ error: "Não encontrado" }, { status: 404 });
  if (report.userId !== user.id) return Response.json({ error: "Não autorizado" }, { status: 403 });

  return Response.json(report);
}
```

---

## Regras de negócio

1. `userId` no INSERT **sempre** da sessão — nunca do body
2. GET `/api/reports/[id]` **sempre** verifica `report.userId === session.userId` → 403 se diferente
3. Listar retorna **apenas relatórios do próprio usuário**
4. Relatório salvo reproduz o dashboard **sem re-parsear o arquivo original** (pode não existir mais em disco)
5. Ordenação: `created_at DESC` (mais recente primeiro)
