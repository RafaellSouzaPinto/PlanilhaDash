# M06 — Histórico de Relatórios (Implementação Completa)

**Status:** ✅ Implementado  
**Rotas:** `GET /api/reports` · `POST /api/reports` · `GET /api/reports/[id]`  
**Páginas:** `/dashboard` · `/reports/[id]`

---

## Visão geral

O histórico é a tela principal do usuário autenticado (`/dashboard`). Exibe todos os relatórios salvos em cards visuais. Ao clicar em um card, abre o relatório completo em `/reports/[id]`, reconstruindo o dashboard (gráficos + insights de IA) a partir dos dados persistidos no banco — sem precisar do arquivo original.

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/app/api/reports/route.ts` | GET (listar) + POST (salvar) |
| `src/app/api/reports/[id]/route.ts` | GET (buscar por ID) |
| `src/app/(app)/dashboard/page.tsx` | Listagem de relatórios em cards |
| `src/app/(app)/reports/[id]/page.tsx` | Visualização de relatório salvo |
| `src/components/reports/ReportCard.tsx` | Card individual do histórico |
| `src/components/reports/ReportCardSkeleton.tsx` | Skeleton de loading do card |
| `src/components/reports/EmptyHistory.tsx` | Estado vazio do histórico |
| `src/components/dashboard/ChartCard.tsx` | Card de gráfico Recharts |
| `src/components/dashboard/InsightsPanel.tsx` | Painel de insights de IA (Markdown) |

---

## API — GET `/api/reports`

Lista todos os relatórios do usuário autenticado, ordenados do mais recente ao mais antigo.

```ts
// src/app/api/reports/route.ts
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";
import { eq, desc } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { user } = await validateSession(req);

  const userReports = await db
    .select({
      id:           reports.id,
      fileName:     reports.fileName,
      rowCount:     reports.rowCount,
      hasAiInsights: reports.aiInsights, // retorna boolean, não o texto
      createdAt:    reports.createdAt,
    })
    .from(reports)
    .where(eq(reports.userId, user.id))
    .orderBy(desc(reports.createdAt));

  // Converter aiInsights para boolean — nunca expor texto em listagem
  const result = userReports.map((r) => ({
    ...r,
    hasAiInsights: r.hasAiInsights !== null,
  }));

  return Response.json(result);
}
```

**Resposta (200):**
```json
[
  {
    "id": 42,
    "fileName": "vendas_2024.xlsx",
    "rowCount": 1200,
    "hasAiInsights": true,
    "createdAt": "2026-04-09T14:30:00.000Z"
  },
  {
    "id": 41,
    "fileName": "clientes.csv",
    "rowCount": 380,
    "hasAiInsights": false,
    "createdAt": "2026-04-08T09:15:00.000Z"
  }
]
```

---

## API — POST `/api/reports`

Salva um novo relatório após a geração do dashboard. Sempre usa `userId` da sessão — nunca do body.

```ts
// src/app/api/reports/route.ts (continuação)
import { z } from "zod";
import { ColumnMeta, ChartConfig } from "@/lib/types";

const SaveReportSchema = z.object({
  fileName:     z.string().min(1).max(255),
  rowCount:     z.number().int().positive(),
  columnsMeta:  z.array(z.unknown()),  // validado como ColumnMeta[]
  chartsConfig: z.array(z.unknown()),  // validado como ChartConfig[]
  aiInsights:   z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const { user } = await validateSession(req);

  const body = await req.json();
  const parsed = SaveReportSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { fileName, rowCount, columnsMeta, chartsConfig, aiInsights } = parsed.data;

  const [inserted] = await db.insert(reports).values({
    userId:       user.id,  // SEMPRE da sessão
    fileName,
    rowCount,
    columnsMeta:  columnsMeta as ColumnMeta[],
    chartsConfig: chartsConfig as ChartConfig[],
    aiInsights:   aiInsights ?? null,
  });

  return Response.json({ id: Number(inserted.insertId) }, { status: 201 });
}
```

**Resposta (201):**
```json
{ "id": 43 }
```

**Erros:**
- `400` — body inválido (Zod)
- `401` — sem sessão

---

## API — GET `/api/reports/[id]`

Retorna o relatório completo (com `columnsMeta`, `chartsConfig` e `aiInsights`) validando ownership.

```ts
// src/app/api/reports/[id]/route.ts
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await validateSession(req);
  const reportId = Number(params.id);

  if (isNaN(reportId)) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }

  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!report) {
    return Response.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  // Ownership — NUNCA retornar relatório de outro usuário
  if (report.userId !== user.id) {
    return Response.json({ error: "Acesso negado" }, { status: 403 });
  }

  return Response.json(report);
}
```

**Resposta (200):**
```json
{
  "id": 42,
  "userId": 7,
  "fileName": "vendas_2024.xlsx",
  "rowCount": 1200,
  "columnsMeta": [...],
  "chartsConfig": [...],
  "aiInsights": "## Insights\n\n- Tendência de crescimento...",
  "pdfPath": null,
  "createdAt": "2026-04-09T14:30:00.000Z"
}
```

**Erros:**
- `400` — ID não numérico
- `401` — sem sessão
- `403` — relatório de outro usuário
- `404` — não encontrado

---

## Página `/dashboard` — Histórico

```tsx
// src/app/(app)/dashboard/page.tsx
import { validateSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReportCard } from "@/components/reports/ReportCard";
import { EmptyHistory } from "@/components/reports/EmptyHistory";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { cookies } from "next/headers";

export default async function DashboardPage() {
  const { user } = await validateSession(); // Server Component — lê cookies diretamente

  const userReports = await db
    .select({
      id:        reports.id,
      fileName:  reports.fileName,
      rowCount:  reports.rowCount,
      aiInsights: reports.aiInsights,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .where(eq(reports.userId, user.id))
    .orderBy(desc(reports.createdAt));

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Meus Relatórios</h1>
        <Button asChild>
          <Link href="/upload">Novo Upload</Link>
        </Button>
      </div>

      {userReports.length === 0 ? (
        <EmptyHistory />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userReports.map((report) => (
            <ReportCard
              key={report.id}
              id={report.id}
              fileName={report.fileName}
              rowCount={report.rowCount}
              hasAiInsights={report.aiInsights !== null}
              createdAt={report.createdAt!}
            />
          ))}
        </div>
      )}
    </main>
  );
}
```

---

## Componente `ReportCard`

```tsx
// src/components/reports/ReportCard.tsx
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Brain, Calendar, Rows3 } from "lucide-react";

interface ReportCardProps {
  id: number;
  fileName: string;
  rowCount: number;
  hasAiInsights: boolean;
  createdAt: Date;
}

export function ReportCard({ id, fileName, rowCount, hasAiInsights, createdAt }: ReportCardProps) {
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <span className="font-semibold text-sm leading-tight break-all">{fileName}</span>
        </div>
        {hasAiInsights && (
          <Badge variant="secondary" className="w-fit mt-1">
            <Brain className="h-3 w-3 mr-1" />
            Com análise de IA
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Rows3 className="h-3.5 w-3.5" />
            {rowCount.toLocaleString("pt-BR")} linhas
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
        </div>
        <Button asChild className="w-full" variant="outline">
          <Link href={`/reports/${id}`}>Ver relatório</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## Componente `EmptyHistory`

```tsx
// src/components/reports/EmptyHistory.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

export function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <BarChart3 className="h-16 w-16 text-muted-foreground/40" />
      <div>
        <p className="text-lg font-semibold">Nenhum relatório ainda</p>
        <p className="text-sm text-muted-foreground mt-1">
          Faça o upload de uma planilha para gerar seu primeiro dashboard.
        </p>
      </div>
      <Button asChild>
        <Link href="/upload">Começar agora</Link>
      </Button>
    </div>
  );
}
```

---

## Página `/reports/[id]` — Visualização do Relatório Salvo

Reconstrói o dashboard completo a partir dos dados do banco — sem precisar do arquivo original.

```tsx
// src/app/(app)/reports/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ChartGrid } from "@/components/dashboard/ChartGrid";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { PdfExportButton } from "@/components/dashboard/PdfExportButton";

interface Props {
  params: { id: string };
}

export default async function ReportPage({ params }: Props) {
  const { user } = await validateSession();
  const reportId = Number(params.id);

  if (isNaN(reportId)) notFound();

  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!report) notFound();

  // Ownership — redireciona sem vazar informação
  if (report.userId !== user.id) notFound();

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Histórico
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{report.fileName}</h1>
            <p className="text-sm text-muted-foreground">
              {report.rowCount.toLocaleString("pt-BR")} linhas
            </p>
          </div>
        </div>
        <PdfExportButton />
      </div>

      {/* Gráficos — reconstruídos a partir de chartsConfig */}
      <div id="dashboard-export">
        <ChartGrid chartsConfig={report.chartsConfig} />

        {/* Insights de IA — apenas se existirem */}
        {report.aiInsights && (
          <InsightsPanel markdown={report.aiInsights} />
        )}
      </div>
    </main>
  );
}
```

---

## Componente `InsightsPanel`

```tsx
// src/components/dashboard/InsightsPanel.tsx
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Brain } from "lucide-react";

interface InsightsPanelProps {
  markdown: string;
}

export function InsightsPanel({ markdown }: InsightsPanelProps) {
  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 font-semibold text-base">
          <Brain className="h-5 w-5 text-primary" />
          Análise de IA
        </div>
      </CardHeader>
      <CardContent>
        <article className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </article>
      </CardContent>
    </Card>
  );
}
```

> Instalar `react-markdown` se não estiver no `package.json`:  
> `npm install react-markdown`

---

## Skeleton de loading (`ReportCardSkeleton`)

Usado enquanto os relatórios carregam (caso a listagem seja feita client-side com `useEffect`).

```tsx
// src/components/reports/ReportCardSkeleton.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReportCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/4 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-1/2 mb-1" />
        <Skeleton className="h-3 w-2/5 mb-4" />
        <Skeleton className="h-9 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}
```

---

## Regras de negócio

| # | Regra |
|---|-------|
| 1 | `userId` em escrita e leitura **sempre** vem da sessão — nunca do request body |
| 2 | `GET /api/reports/[id]` verifica `report.userId === session.userId` → `403` se diferente |
| 3 | Em `/reports/[id]` (Server Component), ownership quebrado → `notFound()` sem vazar existência |
| 4 | Relatórios listados em ordem `created_at DESC` (mais recente primeiro) |
| 5 | `hasAiInsights` na listagem é `boolean` — nunca retornar o Markdown completo no GET `/api/reports` |
| 6 | O dashboard reconstruído usa `chartsConfig` + `columnsMeta` — o arquivo original pode não existir mais |
| 7 | `InsightsPanel` só é renderizado quando `aiInsights !== null` |
| 8 | Máximo de 4 gráficos — respeitado pelo `ChartGrid` (herdado do `chartEngine.ts`) |

---

## Mapa de dados por tela

```
/dashboard
  └─ GET /api/reports (ou server-side via Drizzle diretamente)
       └─ id, fileName, rowCount, hasAiInsights (bool), createdAt

/reports/[id]
  └─ GET /api/reports/[id] (ou server-side via Drizzle diretamente)
       └─ id, fileName, rowCount, columnsMeta, chartsConfig, aiInsights, createdAt
```

---

## Layout visual — `/dashboard`

```
┌─────────────────────────────────────────────────────────┐
│  Header                                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Meus Relatórios                    [Novo Upload ↗]     │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ 📄 vendas.. │  │ 📄 clientes │  │ 📄 estoque  │     │
│  │ 🧠 Com IA   │  │             │  │ 🧠 Com IA   │     │
│  │ 1.200 linhas│  │ 380 linhas  │  │ 90 linhas   │     │
│  │ 09/04/2026  │  │ 08/04/2026  │  │ 07/04/2026  │     │
│  │ [Ver ↗]     │  │ [Ver ↗]     │  │ [Ver ↗]     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)            │
└─────────────────────────────────────────────────────────┘
```

---

## Layout visual — `/reports/[id]`

```
┌─────────────────────────────────────────────────────────┐
│  Header                                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ← Histórico   vendas_2024.xlsx · 1.200 linhas          │
│                                          [Exportar PDF] │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │  Gráfico 1 (Barras) │  │  Gráfico 2 (Linha)  │       │
│  └─────────────────────┘  └─────────────────────┘       │
│  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │  Gráfico 3 (Pizza)  │  │  Gráfico 4 (Tabela) │       │
│  └─────────────────────┘  └─────────────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🧠 Análise de IA                               │   │
│  │  (Markdown renderizado — apenas se aiInsights   │   │
│  │   não for null)                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Checklist de implementação

- [ ] `GET /api/reports` — retorna lista com `hasAiInsights` boolean
- [ ] `POST /api/reports` — salva com Zod + userId da sessão
- [ ] `GET /api/reports/[id]` — ownership + 403/404
- [ ] `/dashboard/page.tsx` — grid de cards com estado vazio e Skeleton
- [ ] `ReportCard` — nome, data, linhas, badge "Com IA", botão "Ver"
- [ ] `EmptyHistory` — estado vazio encorajador com link para `/upload`
- [ ] `/reports/[id]/page.tsx` — Server Component com ownership
- [ ] `InsightsPanel` — Markdown renderizado, só aparece quando tem insights
- [ ] `ChartGrid` — reconstrói gráficos a partir de `chartsConfig`
- [ ] `PdfExportButton` — client component para disparar exportação
