# Skill: Testing

**Projeto:** PlanilhaDash
**Abordagem:** Testes unitários (inferTypes, chartEngine) + testes de integração (API Routes)

---

## Regra fundamental

> Testes de integração devem usar banco real (MariaDB de teste), **nunca mocks de banco**.
>
> Motivo: mocks não detectam problemas de schema, queries malformadas ou comportamento de CASCADE. O PlanilhaDash já passou por incidentes onde mocks mascararam erros de migration.

---

## Setup de banco de teste

```bash
# Criar banco de teste
mysql -u root -p -e "CREATE DATABASE planilhadash_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# .env.test
DATABASE_URL=mysql://root:password@localhost:3306/planilhadash_test
ENCRYPTION_KEY=<mesma key ou uma de teste>
```

---

## O que testar

### Obrigatório (unitários)
- `src/lib/inferTypes.ts` — detecção de todos os tipos de coluna
- `src/lib/chartEngine.ts` — seleção correta de gráficos, limite de 4
- `src/lib/crypto/apiKey.ts` — encrypt → decrypt === original

### Obrigatório (integração)
- `POST /api/auth/signup` — criação de usuário + sessão
- `POST /api/auth/login` — validação de credenciais
- `POST /api/auth/logout` — invalidação de sessão no banco
- `GET /api/reports/[id]` — verificação de ownership (403 se não é dono)

### Manual (ver docs/testes/)
- [T01_AUTH.md](../../../docs/testes/T01_AUTH.md)
- [T02_PARSER.md](../../../docs/testes/T02_PARSER.md)
- [T03_CHART_ENGINE.md](../../../docs/testes/T03_CHART_ENGINE.md)

---

## Estrutura de testes sugerida

```
tests/
├── unit/
│   ├── inferTypes.test.ts
│   ├── chartEngine.test.ts
│   └── crypto.test.ts
└── integration/
    ├── auth.test.ts
    ├── reports.test.ts
    └── ai-analyze.test.ts
```

---

## Padrão de teste

```ts
// tests/unit/inferTypes.test.ts
describe("inferTypes", () => {
  it("detecta currency para colunas com R$", () => {
    const rows = [
      { valor: "R$ 1.200,00" },
      { valor: "R$ 350,00" },
    ];
    const [col] = inferTypes(rows);
    expect(col.type).toBe("currency");
  });

  it("nunca retorna mais de 4 configs no chartEngine", () => {
    const columns: ColumnMeta[] = [/* 10 colunas */];
    const configs = buildChartConfigs(columns);
    expect(configs.length).toBeLessThanOrEqual(4);
  });
});
```

---

## Proibições

- Nunca mockar o banco de dados — sempre usar `planilhadash_test`
- Nunca testar com `process.env.DATABASE_URL` de produção
- Nunca commitar testes que dependem de dados externos (APIs de IA) sem mockear o provider
- Testes de criptografia: usar uma `ENCRYPTION_KEY` de teste, nunca a de produção
