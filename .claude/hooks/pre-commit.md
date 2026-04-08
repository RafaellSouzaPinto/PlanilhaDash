# Hook: pre-commit

**Quando executa:** antes de cada `git commit`

---

## Checklist obrigatório antes de commitar

### Segurança
- [ ] Nenhum arquivo `.env.local`, `.env`, `*.key` ou `*.pem` está staged
- [ ] Nenhuma API Key, password ou secret hardcoded no diff (`grep -r "sk-" src/` deve estar vazio)
- [ ] `ENCRYPTION_KEY` não aparece em nenhum arquivo JS/TS fora de `.env*`

### Qualidade de código
- [ ] `npm run lint` passa sem erros
- [ ] Nenhum `any` introduzido sem comentário justificando
- [ ] Nenhuma chamada `console.log` deixada em API Routes de produção

### Banco de dados
- [ ] Se `src/lib/db/schema.ts` foi alterado → `npm run db:push` ou `npm run db:generate` foi rodado
- [ ] Nenhuma migration manual em SQL diretamente no banco sem registro em `docs/decisions/correcoes.md`

### Testes
- [ ] Se um módulo foi alterado → o teste manual correspondente em `docs/testes/` foi executado

---

## Convenção de commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(auth): adiciona fluxo de signup com Lucia Auth
fix(chartEngine): corrige seleção de gráfico para datas ISO
docs(spec): documenta criptografia da API Key
refactor(parser): extrai validação de tamanho de arquivo
test(inferTypes): adiciona testes para detecção de moeda
chore(deps): atualiza Drizzle ORM para 0.36.1
```

**Tipos válidos:** `feat` · `fix` · `docs` · `refactor` · `test` · `chore` · `style` · `perf`

**Formato de branch:**
```
feat/nome-do-recurso
fix/descricao-do-bug
docs/o-que-foi-documentado
refactor/modulo-refatorado
```
