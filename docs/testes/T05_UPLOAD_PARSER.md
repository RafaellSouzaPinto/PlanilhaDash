# T05 — Testes: Upload e Parser

**Feature:** [F05_UPLOAD_PARSER.md](../runbooks/F05_UPLOAD_PARSER.md)

---

## Planilhas de teste (`public/samples/`)

| Arquivo | Conteúdo | O que valida |
|---------|----------|-------------|
| `vendas-simples.csv` | Produto, Categoria, Valor, Mês | Barras + Linha |
| `rh-funcionarios.xlsx` | Nome, Departamento, Salário, Data de Admissão | Pizza + Barras |
| `financeiro.csv` | Receita, Despesa, Lucro, Mês (R$) | Linha + moeda |
| `estoque-5k.csv` | 5000 linhas, 8 colunas | Performance e limite |

---

## Testes manuais

### Upload
- [ ] CSV válido → parse correto, dashboard gerado
- [ ] XLSX válido → parse correto, dashboard gerado
- [ ] Arquivo > 10MB → erro antes do envio, sem travar o browser
- [ ] Extensão `.txt` → mensagem de erro clara, sem processar
- [ ] Dropzone: arrastar arquivo → mesma validação do clique

### Inferência de tipos
- [ ] Coluna com `R$ 1.200,00` → tipo `currency`
- [ ] Coluna com `45%`, `12%` → tipo `percentage`
- [ ] Coluna com `2024-01-15` → tipo `date`
- [ ] Coluna com `01/15/2024` → tipo `date` (formato US)
- [ ] Coluna com `15/01/2024` → tipo `date` (formato BR)
- [ ] Coluna com números puros → tipo `number`
- [ ] Coluna: TI/RH/Vendas (poucos únicos) → tipo `categorical`
- [ ] Coluna com texto livre → tipo `text`
- [ ] CSV com delimitador `;` → PapaParse detecta automaticamente

---

## Testes automatizados

```ts
// tests/unit/inferTypes.test.ts
describe("inferTypes", () => {
  it("detecta currency para colunas com R$", () => {
    const rows = Array.from({ length: 10 }, () => ({ valor: "R$ 1.200,00" }));
    const [col] = inferTypes(rows);
    expect(col.type).toBe("currency");
  });

  it("detecta percentage para colunas com %", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ pct: `${i * 10}%` }));
    const [col] = inferTypes(rows);
    expect(col.type).toBe("percentage");
  });

  it("detecta date para formato ISO", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ data: `2024-0${i+1}-01` }));
    const [col] = inferTypes(rows);
    expect(col.type).toBe("date");
  });

  it("detecta number para numéricos puros", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ qtd: i * 100 }));
    const [col] = inferTypes(rows);
    expect(col.type).toBe("number");
  });

  it("detecta categorical quando únicos/total < 20%", () => {
    const depts = ["TI", "RH", "Vendas"];
    const rows = Array.from({ length: 30 }, (_, i) => ({ dept: depts[i % 3] }));
    const [col] = inferTypes(rows);
    expect(col.type).toBe("categorical");
  });

  it("fallback para text em colunas mistas", () => {
    const rows = [{ x: "abc" }, { x: "def" }, { x: "ghi" }, { x: "jkl" }];
    const [col] = inferTypes(rows);
    expect(col.type).toBe("text");
  });

  it("ignora valores nulos ao calcular proporções", () => {
    const rows = [{ v: null }, { v: null }, { v: "R$ 100" }, { v: "R$ 200" }];
    const [col] = inferTypes(rows);
    expect(col.type).toBe("currency");
  });

  it("usa no máximo 100 amostras por coluna", () => {
    const rows = Array.from({ length: 200 }, (_, i) => ({ v: i }));
    // não deve travar ou lançar erro
    expect(() => inferTypes(rows)).not.toThrow();
  });
});

// tests/unit/parser.test.ts
describe("parseFile", () => {
  it("lança erro para arquivo acima do limite", async () => {
    const bigFile = new File([new ArrayBuffer(11 * 1024 * 1024)], "big.csv", { type: "text/csv" });
    await expect(parseFile(bigFile)).rejects.toThrow("Arquivo muito grande");
  });

  it("lança erro para extensão desconhecida", async () => {
    const file = new File(["data"], "test.txt", { type: "text/plain" });
    await expect(parseFile(file)).rejects.toThrow("Formato não suportado");
  });
});
```
