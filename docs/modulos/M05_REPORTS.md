# M05 — Histórico de Relatórios

**Status:** 🚧 Em desenvolvimento

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/app/api/reports/route.ts` | GET (listar) + POST (salvar) |
| `src/app/api/reports/[id]/route.ts` | GET (buscar por ID) |
| `src/app/(app)/dashboard/page.tsx` | Listagem de relatórios |
| `src/app/(app)/reports/[id]/page.tsx` | Visualização de relatório salvo |

---

## Listar relatórios (GET `/api/reports`)

```ts
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const { user } = await validateSession(req);

  const userReports = await db
    .select({
      id:        reports.id,
      fileName:  reports.fileName,
      rowCount:  reports.rowCount,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .where(eq(reports.userId, user.id))
    .orderBy(desc(reports.createdAt));

  return Response.json(userReports);
}
```

---

## Buscar relatório por ID (GET `/api/reports/[id]`)

```ts
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { user } = await validateSession(req);
  const reportId = Number(params.id);

  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);

  if (!report) return Response.json({ error: "Não encontrado" }, { status: 404 });

  // Verificar ownership — SEMPRE
  if (report.userId !== user.id) return Response.json({ error: "Não autorizado" }, { status: 403 });

  return Response.json(report);
}
```

---

## Regras de negócio

1. **Ownership obrigatório:** GET `/api/reports/[id]` sempre verifica `report.userId === session.userId`
2. **Listar apenas do próprio usuário:** WHERE clause com `userId` da sessão
3. **Ordenação:** relatórios ordenados por `created_at DESC` (mais recente primeiro)
4. **Relatório salvo reproduz o dashboard exato:** `columns_meta` + `charts_config` são suficientes para recriar sem re-parsear o arquivo original

---

## Página de histórico (`/dashboard`)

- Grid responsivo de cards de relatório
- Cada card: nome do arquivo, data, número de linhas, botão "Ver"
- Estado vazio: mensagem encorajando o primeiro upload
- Loading: Skeleton de 6 cards

## Página de relatório salvo (`/reports/[id]`)

- Carrega `columns_meta`, `charts_config` e `ai_insights` do banco
- Reconstrói o dashboard sem re-parsear o arquivo (arquivo original pode não existir mais)
- Se `ai_insights` não é null: exibir InsightsPanel
- Botão "Exportar PDF" disponível
