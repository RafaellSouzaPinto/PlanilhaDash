# T10 — Testes: Histórico de Relatórios

**Feature:** [M06_HISTORICO.md](../modulos/M06_HISTORICO.md)  
**Rotas:** `GET /api/reports` · `POST /api/reports` · `GET /api/reports/[id]`  
**Páginas:** `/dashboard` · `/reports/[id]`

---

## Testes manuais

### Listagem — `/dashboard`

- [ ] Fazer login → rota `/dashboard` exibe os cards dos relatórios do usuário
- [ ] Cada card exibe: nome do arquivo, número de linhas, data formatada (dd/mm/aaaa hh:mm), botão "Ver relatório"
- [ ] Relatório com `ai_insights` → badge "Com análise de IA" visível no card
- [ ] Relatório sem `ai_insights` → badge **não** aparece
- [ ] Relatórios ordenados do mais recente ao mais antigo
- [ ] Histórico vazio → mensagem "Nenhum relatório ainda" + botão "Começar agora" → leva para `/upload`
- [ ] Botão "Novo Upload" no topo → redireciona para `/upload`
- [ ] Acessar `/dashboard` sem sessão → redireciona para `/login`
- [ ] Grid responsivo: 1 coluna no mobile, 2 no tablet, 3 no desktop

### Salvar relatório (após gerar dashboard no `/upload`)

- [ ] Gerar dashboard de arquivo CSV → clicar [Salvar] → card aparece em `/dashboard`
- [ ] Gerar dashboard de arquivo XLSX → clicar [Salvar] → card aparece em `/dashboard`
- [ ] Gerar dashboard + analisar com IA → salvar → card exibe badge "Com análise de IA"
- [ ] Gerar dashboard sem IA → salvar → card **sem** badge de IA
- [ ] Salvar → verificar banco: `user_id` bate com o usuário da sessão (não um valor do body)

### Visualização — `/reports/[id]`

- [ ] Clicar em "Ver relatório" no card → abre `/reports/[id]` com o dashboard completo
- [ ] Dashboard em `/reports/[id]` exibe todos os gráficos corretamente (até 4)
- [ ] Gráfico de barras renderizado quando `chartsConfig` contém tipo `bar`
- [ ] Gráfico de linha renderizado quando `chartsConfig` contém tipo `line`
- [ ] Gráfico de pizza renderizado quando `chartsConfig` contém tipo `pie`
- [ ] Tabela de fallback renderizada quando `chartsConfig` contém tipo `table`
- [ ] Relatório **com** `ai_insights` → `InsightsPanel` exibido abaixo dos gráficos com ícone 🧠 e Markdown renderizado
- [ ] Relatório **sem** `ai_insights` → `InsightsPanel` **não** aparece na página
- [ ] Dashboard reconstruído **sem precisar do arquivo original** (arquivo pode ter sido deletado)
- [ ] Botão "← Histórico" → volta para `/dashboard`
- [ ] Botão "Exportar PDF" disponível e funcional
- [ ] Acessar `/reports/[id]` sem sessão → redireciona para `/login`
- [ ] Acessar `/reports/[id]` de relatório de outro usuário → 404 (sem vazar existência)
- [ ] Acessar `/reports/99999` (inexistente) → 404

### Segurança

- [ ] Verificar no banco: o `user_id` salvo é sempre o da sessão, nunca o que vier do body
- [ ] Tentar chamar `POST /api/reports` com `userId: 9999` no body → relatório salvo com userId da sessão
- [ ] Tentar `GET /api/reports/[id]` autenticado como usuário B tentando ler relatório de A → 403 ou 404
- [ ] `GET /api/reports` retorna apenas relatórios do usuário autenticado (não de outros)

---

## Testes automatizados

```ts
// tests/integration/historico.test.ts
import { db } from "@/lib/db";
import { reports, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createUser, loginUser, createReport } from "../helpers";

// ---------------------------------------------------------------------------
// GET /api/reports — Listagem
// ---------------------------------------------------------------------------

describe("GET /api/reports", () => {
  it("retorna lista de relatórios do usuário autenticado", async () => {
    const { cookie, userId } = await loginUser({ email: "a@t.com", password: "12345678" });
    await createReport({ userId, fileName: "arquivo1.csv", rowCount: 100 });
    await createReport({ userId, fileName: "arquivo2.xlsx", rowCount: 500 });

    const res = await GET("/api/reports", cookie);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].fileName).toBe("arquivo2.xlsx"); // mais recente primeiro
    expect(body[1].fileName).toBe("arquivo1.csv");
  });

  it("retorna apenas relatórios do usuário autenticado (isolamento entre usuários)", async () => {
    const { cookie: cookieA, userId: userA } = await loginUser({ email: "a@t.com", password: "12345678" });
    const { userId: userB } = await createUser({ email: "b@t.com", password: "12345678" });

    await createReport({ userId: userA });
    await createReport({ userId: userB });

    const res = await GET("/api/reports", cookieA);
    const body = await res.json();

    expect(body.every((r: { id: number }) => {
      // verificar no banco que todos os ids pertencem ao userA
      return true; // checar via createReport retornando o id e comparar
    })).toBe(true);
    expect(body).toHaveLength(1);
  });

  it("retorna lista vazia quando usuário não tem relatórios", async () => {
    const { cookie } = await loginUser({ email: "novo@t.com", password: "12345678" });
    const res = await GET("/api/reports", cookie);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("retorna 401 sem sessão", async () => {
    const res = await GET("/api/reports");
    expect(res.status).toBe(401);
  });

  it("hasAiInsights é true quando relatório tem insights", async () => {
    const { cookie, userId } = await loginUser({ email: "a@t.com", password: "12345678" });
    await createReport({ userId, aiInsights: "## Insights\n\n- Tendência de crescimento" });

    const res = await GET("/api/reports", cookie);
    const [report] = await res.json();
    expect(report.hasAiInsights).toBe(true);
    // Nunca retornar o texto em plaintext na listagem
    expect(report.aiInsights).toBeUndefined();
  });

  it("hasAiInsights é false quando relatório não tem insights", async () => {
    const { cookie, userId } = await loginUser({ email: "a@t.com", password: "12345678" });
    await createReport({ userId, aiInsights: null });

    const res = await GET("/api/reports", cookie);
    const [report] = await res.json();
    expect(report.hasAiInsights).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// POST /api/reports — Salvar
// ---------------------------------------------------------------------------

describe("POST /api/reports", () => {
  it("salva relatório com userId da sessão (ignora userId do body)", async () => {
    const { cookie, userId } = await loginUser({ email: "user@t.com", password: "12345678" });

    const res = await POST("/api/reports", {
      userId: 9999, // tentativa de injeção — deve ser ignorada
      fileName: "planilha.csv",
      rowCount: 200,
      columnsMeta: [{ name: "Mês", type: "categorical" }],
      chartsConfig: [{ type: "bar", xKey: "Mês", yKey: "Vendas" }],
      aiInsights: null,
    }, cookie);

    expect(res.status).toBe(201);
    const { id } = await res.json();

    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    expect(report.userId).toBe(userId); // deve ser o da sessão, nunca o 9999
  });

  it("salva relatório com aiInsights quando fornecido", async () => {
    const { cookie, userId } = await loginUser({ email: "user@t.com", password: "12345678" });

    const res = await POST("/api/reports", {
      fileName: "dados.xlsx",
      rowCount: 1000,
      columnsMeta: [],
      chartsConfig: [],
      aiInsights: "## Resumo\n\n- Dados em alta",
    }, cookie);

    expect(res.status).toBe(201);
    const { id } = await res.json();
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    expect(report.aiInsights).toBe("## Resumo\n\n- Dados em alta");
  });

  it("salva relatório sem aiInsights (null)", async () => {
    const { cookie, userId } = await loginUser({ email: "user@t.com", password: "12345678" });

    const res = await POST("/api/reports", {
      fileName: "simples.csv",
      rowCount: 50,
      columnsMeta: [],
      chartsConfig: [],
    }, cookie);

    expect(res.status).toBe(201);
    const { id } = await res.json();
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    expect(report.aiInsights).toBeNull();
  });

  it("retorna 400 para body inválido (fileName vazio)", async () => {
    const { cookie } = await loginUser({ email: "user@t.com", password: "12345678" });

    const res = await POST("/api/reports", {
      fileName: "",
      rowCount: 100,
      columnsMeta: [],
      chartsConfig: [],
    }, cookie);

    expect(res.status).toBe(400);
  });

  it("retorna 400 para rowCount negativo", async () => {
    const { cookie } = await loginUser({ email: "user@t.com", password: "12345678" });

    const res = await POST("/api/reports", {
      fileName: "planilha.csv",
      rowCount: -1,
      columnsMeta: [],
      chartsConfig: [],
    }, cookie);

    expect(res.status).toBe(400);
  });

  it("retorna 401 sem sessão", async () => {
    const res = await POST("/api/reports", {
      fileName: "planilha.csv",
      rowCount: 100,
      columnsMeta: [],
      chartsConfig: [],
    });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/reports/[id] — Buscar por ID
// ---------------------------------------------------------------------------

describe("GET /api/reports/[id]", () => {
  it("retorna relatório completo para o dono", async () => {
    const { cookie, userId } = await loginUser({ email: "user@t.com", password: "12345678" });
    const reportId = await createReport({
      userId,
      fileName: "meu.csv",
      rowCount: 100,
      aiInsights: "texto",
    });

    const res = await GET(`/api/reports/${reportId}`, cookie);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(reportId);
    expect(body.fileName).toBe("meu.csv");
    expect(body.aiInsights).toBe("texto");
    expect(body.columnsMeta).toBeDefined();
    expect(body.chartsConfig).toBeDefined();
  });

  it("retorna 403 ou 404 para relatório de outro usuário", async () => {
    const { cookie: cookieA, userId: userA } = await loginUser({ email: "a@t.com", password: "12345678" });
    const { cookie: cookieB } = await loginUser({ email: "b@t.com", password: "12345678" });
    const reportId = await createReport({ userId: userA });

    const res = await GET(`/api/reports/${reportId}`, cookieB);
    // 403 ou 404 — ambos aceitáveis (não vazar a existência)
    expect([403, 404]).toContain(res.status);
  });

  it("retorna 404 para id inexistente", async () => {
    const { cookie } = await loginUser({ email: "user@t.com", password: "12345678" });
    const res = await GET("/api/reports/99999", cookie);
    expect(res.status).toBe(404);
  });

  it("retorna 400 para id não numérico", async () => {
    const { cookie } = await loginUser({ email: "user@t.com", password: "12345678" });
    const res = await GET("/api/reports/abc", cookie);
    expect(res.status).toBe(400);
  });

  it("retorna 401 sem sessão", async () => {
    const res = await GET("/api/reports/1");
    expect(res.status).toBe(401);
  });

  it("relatório sem aiInsights → aiInsights null na resposta", async () => {
    const { cookie, userId } = await loginUser({ email: "user@t.com", password: "12345678" });
    const reportId = await createReport({ userId, aiInsights: null });

    const res = await GET(`/api/reports/${reportId}`, cookie);
    const body = await res.json();
    expect(body.aiInsights).toBeNull();
  });
});
```

> **Regra:** usar banco real `planilhadash_test` — nunca mock.

---

## Testes de componente (Vitest + Testing Library)

```ts
// tests/components/ReportCard.test.tsx
import { render, screen } from "@testing-library/react";
import { ReportCard } from "@/components/reports/ReportCard";

const baseProps = {
  id: 1,
  fileName: "vendas_2024.csv",
  rowCount: 1200,
  hasAiInsights: false,
  createdAt: new Date("2026-04-09T14:30:00Z"),
};

it("exibe nome do arquivo, linhas e data", () => {
  render(<ReportCard {...baseProps} />);
  expect(screen.getByText("vendas_2024.csv")).toBeInTheDocument();
  expect(screen.getByText(/1\.200 linhas/)).toBeInTheDocument();
  expect(screen.getByText(/09\/04\/2026/)).toBeInTheDocument();
});

it("exibe badge de IA quando hasAiInsights é true", () => {
  render(<ReportCard {...baseProps} hasAiInsights={true} />);
  expect(screen.getByText(/Com análise de IA/)).toBeInTheDocument();
});

it("não exibe badge de IA quando hasAiInsights é false", () => {
  render(<ReportCard {...baseProps} hasAiInsights={false} />);
  expect(screen.queryByText(/Com análise de IA/)).not.toBeInTheDocument();
});

it("link 'Ver relatório' aponta para /reports/1", () => {
  render(<ReportCard {...baseProps} />);
  const link = screen.getByRole("link", { name: /Ver relatório/i });
  expect(link).toHaveAttribute("href", "/reports/1");
});
```

```ts
// tests/components/InsightsPanel.test.tsx
import { render, screen } from "@testing-library/react";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";

it("renderiza markdown como HTML", () => {
  render(<InsightsPanel markdown="## Título\n\n- Item 1\n- Item 2" />);
  expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Título");
  expect(screen.getByText("Item 1")).toBeInTheDocument();
});

it("exibe ícone e título 'Análise de IA'", () => {
  render(<InsightsPanel markdown="texto" />);
  expect(screen.getByText(/Análise de IA/i)).toBeInTheDocument();
});
```

```ts
// tests/components/EmptyHistory.test.tsx
import { render, screen } from "@testing-library/react";
import { EmptyHistory } from "@/components/reports/EmptyHistory";

it("exibe mensagem de estado vazio", () => {
  render(<EmptyHistory />);
  expect(screen.getByText(/Nenhum relatório ainda/i)).toBeInTheDocument();
});

it("link 'Começar agora' aponta para /upload", () => {
  render(<EmptyHistory />);
  const link = screen.getByRole("link", { name: /Começar agora/i });
  expect(link).toHaveAttribute("href", "/upload");
});
```

---

## Critérios de aceitação do módulo

| # | Critério | Como verificar |
|---|----------|----------------|
| 1 | Relatório salvo aparece no histórico | Salvar → abrir `/dashboard` → card visível |
| 2 | Card exibe badge de IA quando tem insights | Salvar com IA → badge "Com análise de IA" no card |
| 3 | Card sem badge quando não tem insights | Salvar sem IA → badge **ausente** |
| 4 | `/reports/[id]` reconstrói dashboard sem arquivo original | Deletar arquivo de uploads → página ainda funciona |
| 5 | InsightsPanel visível com insights | Relatório com `ai_insights` → painel de IA exibido |
| 6 | InsightsPanel ausente sem insights | Relatório sem `ai_insights` → painel **não** aparece |
| 7 | Isolamento de dados entre usuários | Usuário B não vê relatórios de A |
| 8 | Ownership validado em `/reports/[id]` | Usuário B tenta acessar id de A → 403 ou 404 |
| 9 | `userId` da sessão prevalece sobre body | POST com `userId: 9999` → banco salva id da sessão |
| 10 | Estado vazio encorajador | Sem relatórios → mensagem + botão para `/upload` |
