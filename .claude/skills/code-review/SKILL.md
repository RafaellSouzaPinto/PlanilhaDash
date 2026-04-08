# Skill: Code Review

**Projeto:** PlanilhaDash
**Uso:** Checklist a seguir antes de aprovar ou commitar qualquer alteração.

---

## Checklist de segurança

- [ ] Nenhum `any` sem justificativa comentada
- [ ] Nenhuma API Key, hash ou secret hardcoded
- [ ] `userId` nas queries sempre vem da sessão do servidor — nunca do request body
- [ ] `encryptApiKey` / `decryptApiKey` são os únicos pontos de criptografia — sem reimplementações
- [ ] API Routes validam input com Zod antes de usar os dados
- [ ] GET `/api/reports/[id]` verifica que `report.userId === session.userId`
- [ ] Nenhum dado sensível retornado em respostas (ex: `password_hash`, `ai_api_key`)

## Checklist de banco

- [ ] Se `schema.ts` foi alterado → migration executada
- [ ] Queries usam colunas explícitas (sem `SELECT *` em tabelas grandes)
- [ ] Inputs de usuário nunca interpolados diretamente em `sql`` ` raw

## Checklist de TypeScript

- [ ] Nenhum `any` — usar `unknown` com type guard
- [ ] Props de componentes sempre tipadas explicitamente
- [ ] Tipos de retorno declarados em funções exportadas
- [ ] Nenhum `// @ts-ignore` sem comentário justificado

## Checklist de Next.js

- [ ] Lógica de banco/servidor não está em Client Components
- [ ] `ENCRYPTION_KEY` e outros secrets não em variáveis `NEXT_PUBLIC_*`
- [ ] API Routes retornam `Response.json()` com status code adequado

## Checklist de qualidade geral

- [ ] `npm run lint` passa sem erros
- [ ] Nenhum `console.log` deixado em código de produção (API Routes)
- [ ] Funções seguem o princípio de responsabilidade única
- [ ] Código novo não duplica lógica já existente em `src/lib/`
- [ ] Arquivos novos seguem a convenção de nomenclatura do projeto

## Checklist de commit

- [ ] Mensagem segue Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- [ ] Branch nomeada corretamente (`feat/`, `fix/`, `docs/`, `refactor/`)
- [ ] Nenhum arquivo sensível staged (`.env*`, uploads, etc.)
