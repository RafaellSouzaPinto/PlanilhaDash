# T07 — Testes: Salvar e Visualizar Relatório

**Feature:** [F07_SAVE_REPORT.md](../runbooks/F07_SAVE_REPORT.md)
**Rotas:** `POST /api/reports` · `GET /api/reports` · `GET /api/reports/[id]`

---

## Testes manuais

- [ ] Clicar [Salvar] após gerar dashboard → relatório aparece no histórico em `/dashboard`
- [ ] Histórico ordenado do mais recente ao mais antigo
- [ ] Clicar em relatório salvo → abre `/reports/[id]` com o mesmo dashboard
- [ ] Dashboard em `/reports/[id]` reconstruído **sem precisar do arquivo original**
- [ ] Se `ai_insights` não é null → InsightsPanel exibido na página do relatório
- [ ] Histórico vazio → mensagem encorajando o primeiro upload
- [ ] Acessar `/reports/[id]` de outro usuário → 403 Forbidden
- [ ] Acessar `/reports/99999` (não existe) → 404
- [ ] Chamar qualquer rota sem sessão → 401

---

## Testes automatizados

```ts
// tests/integration/reports.test.ts
describe("POST /api/reports", () => {
  it("salva relatório com userId da sessão (não do body)", async () => {
    const { cookie, userId } = await loginUser({ email: "user@t.com", password: "12345678" });
    const res = await POST("/api/reports", {
      userId: 9999, // tentativa de injetar userId diferente
      fileName: "teste.csv",
      rowCount: 100,
      columnsMeta: [],
      chartsConfig: [],
    }, cookie);

    expect(res.status).toBe(200);
    const { id } = await res.json();
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    expect(report.userId).toBe(userId); // deve ser o da sessão, não o 9999
  });
});

describe("GET /api/reports/[id]", () => {
  it("retorna 403 para relatório de outro usuário", async () => {
    const { cookie: cookieA, userId: userA } = await loginUser({ email: "a@t.com", password: "12345678" });
    const { cookie: cookieB }                = await loginUser({ email: "b@t.com", password: "12345678" });
    const reportId = await createReport({ userId: userA });

    const res = await GET(`/api/reports/${reportId}`, cookieB); // usuário B tentando acessar relatório de A
    expect(res.status).toBe(403);
  });

  it("retorna 404 para id inexistente", async () => {
    const { cookie } = await loginUser({ email: "user@t.com", password: "12345678" });
    const res = await GET("/api/reports/99999", cookie);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/reports", () => {
  it("retorna apenas relatórios do usuário autenticado", async () => {
    const { cookie: cookieA, userId: userA } = await loginUser({ email: "a@t.com", ... });
    const { userId: userB }                  = await createUser({ email: "b@t.com", ... });
    await createReport({ userId: userA });
    await createReport({ userId: userB });

    const res = await GET("/api/reports", cookieA);
    const body = await res.json();
    expect(body.every(r => r.userId === userA)).toBe(true);
  });
});
```

> **Regra:** usar banco real `planilhadash_test` — nunca mock.
