# T08 — Testes: Exportação PDF

**Feature:** [F08_PDF_EXPORT.md](../runbooks/F08_PDF_EXPORT.md)

---

## Testes manuais

- [ ] Clicar [Exportar PDF] → download automático do arquivo `.pdf`
- [ ] Nome do PDF: `{nome-do-arquivo}-dashboard.pdf` (sem a extensão original)
- [ ] PDF contém todos os gráficos em tamanho legível
- [ ] Botão exibe "Gerando PDF..." durante o processo (loading state)
- [ ] Botão volta ao estado normal após conclusão
- [ ] Testar no Chrome → PDF gerado corretamente
- [ ] Testar no Firefox → PDF gerado corretamente
- [ ] Testar no Safari → PDF gerado corretamente
- [ ] Dashboard com 4 gráficos → todos aparecem no PDF
- [ ] Dashboard com fundo branco → PDF com fundo branco (não transparente)
- [ ] Verificar: export não faz chamada ao servidor (Network tab deve estar vazio)

---

## Testes automatizados

> `html2canvas` e `jsPDF` são difíceis de testar de forma unitária (dependem de DOM real).
> Usar testes manuais e/ou E2E (Playwright/Cypress) para validação completa.

```ts
// tests/unit/pdfExport.test.ts
describe("exportDashboardToPDF", () => {
  it("lança erro se elemento não existe no DOM", async () => {
    await expect(
      exportDashboardToPDF("elemento-inexistente", "arquivo.csv")
    ).rejects.toThrow("não encontrado no DOM");
  });

  it("nome do PDF remove extensão do arquivo original", () => {
    // testar a lógica de geração do nome apenas
    const baseName = "vendas-2024.csv".replace(/\.[^.]+$/, "");
    expect(baseName).toBe("vendas-2024");
    // pdf.save seria chamado com "vendas-2024-dashboard.pdf"
  });
});
```

### Teste E2E sugerido (Playwright)

```ts
test("exporta PDF com todos os gráficos", async ({ page }) => {
  await page.goto("/upload");
  await uploadFile(page, "public/samples/vendas-simples.csv");
  await page.waitForSelector("[data-testid='chart-grid']");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click("[data-testid='export-pdf-button']"),
  ]);

  expect(download.suggestedFilename()).toMatch(/dashboard\.pdf$/);
});
```
