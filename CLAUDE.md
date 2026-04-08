# CLAUDE.md — PlanilhaDash

> Lido automaticamente pelo Claude. Contém instruções de comportamento, contexto do projeto e regras inegociáveis.
> Leia este arquivo e todos os links abaixo ANTES de escrever qualquer código.

---

## Sobre o projeto

**PlanilhaDash** é um micro-SaaS open-source que transforma planilhas de negócios em dashboards visuais interativos.

- **Público-alvo:** Analistas, gestores e pequenas empresas que precisam visualizar dados de planilhas sem ferramentas complexas.
- **Propósito:** Upload de planilha (CSV/XLSX/ODS) → detecção automática de colunas → geração de gráficos → análise de IA com API Key própria do usuário → histórico de relatórios → exportação PDF.
- **Modelo de IA:** Bring Your Own Key — o sistema nunca armazena chaves em plaintext. Suporta OpenAI, Anthropic (Claude), Google (Gemini) e Groq.

---

## Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 14.x |
| Linguagem | TypeScript | 5.x |
| Banco de dados | MariaDB | 10.11 |
| ORM | Drizzle ORM | 0.36.x |
| Migrations CLI | Drizzle Kit | 0.28.x |
| Autenticação | Lucia Auth | 3.x |
| IA multi-provider | Vercel AI SDK | 5.x |
| Gráficos | Recharts | 2.x |
| Parsing XLSX/ODS | SheetJS | 0.20.x |
| Parsing CSV | PapaParse | 5.x |
| UI base | shadcn/ui | latest |
| CSS utilitário | Tailwind CSS | 3.x |
| PDF client-side | html2canvas + jsPDF | 1.x / 2.x |
| Runtime | Node.js | >= 20.x |

---

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais de banco

# 3. Gerar ENCRYPTION_KEY (32 bytes hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 4. Criar banco e tabelas
mysql -u root -p -e "CREATE DATABASE planilhadash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npm run db:push

# 5. Iniciar servidor de desenvolvimento
npm run dev
# → http://localhost:3000

# Scripts adicionais
npm run build         # Build de produção
npm run start         # Servidor de produção
npm run db:studio     # Drizzle Studio (UI visual do banco)
npm run db:generate   # Gerar arquivo de migration
npm run lint          # ESLint
npm run lint:fix      # ESLint + autofix
npm run format        # Prettier
```

---

## Acesso / Login

> Usuário de desenvolvimento — criar manualmente após `npm run db:push`.

| Campo | Valor |
|-------|-------|
| Email | `admin@planilha.dev` |
| Senha | `123456` |

Criar via terminal:
```bash
node -e "require('bcrypt').hash('123456', 12).then(h => console.log(h))"
# Copiar o hash gerado e inserir no SQL abaixo
```

```sql
INSERT INTO users (name, email, password_hash)
VALUES ('Admin Dev', 'admin@planilha.dev', '<hash_gerado_acima>');
```

---

## Documentação — leia ANTES de codar

| Arquivo | Conteúdo |
|---------|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Schema do banco, rotas, relacionamentos, fluxos completos |
| [docs/FRONTEND-SPEC.md](docs/FRONTEND-SPEC.md) | Paleta, tipografia, componentes shadcn, layout de cada tela |
| [docs/FEATURES.md](docs/FEATURES.md) | Visão geral de todas as features com status |
| [docs/runbooks/features.md](docs/runbooks/features.md) | Cada feature detalhada com código real |
| [docs/modulos/00_INDICE_GERAL.md](docs/modulos/00_INDICE_GERAL.md) | Índice de todos os módulos |
| [docs/modulos/00_MAPA_ROTAS_COMPLETO.md](docs/modulos/00_MAPA_ROTAS_COMPLETO.md) | Mapa completo de rotas Next.js |
| [docs/modulos/00_VISAO_GERAL_ARQUITETURA.md](docs/modulos/00_VISAO_GERAL_ARQUITETURA.md) | Diagrama e visão geral da arquitetura |
| [docs/decisions/correcoes.md](docs/decisions/correcoes.md) | Decisões técnicas e correções já aplicadas |

---

## Skills — leia ANTES de codar

| Skill | Arquivo | Quando usar |
|-------|---------|-------------|
| Next.js | [.claude/skills/nextjs/SKILL.md](.claude/skills/nextjs/SKILL.md) | App Router, API Routes, Middleware, Server Actions |
| TypeScript | [.claude/skills/typescript/SKILL.md](.claude/skills/typescript/SKILL.md) | Padrões de tipagem deste projeto |
| Drizzle ORM | [.claude/skills/drizzle/SKILL.md](.claude/skills/drizzle/SKILL.md) | Queries, schema, migrations |
| Tailwind CSS | [.claude/skills/tailwind/SKILL.md](.claude/skills/tailwind/SKILL.md) | Convenções de classes e responsividade |
| shadcn/ui | [.claude/skills/shadcn/SKILL.md](.claude/skills/shadcn/SKILL.md) | Componentes disponíveis e padrões de uso |
| Testing | [.claude/skills/testing/SKILL.md](.claude/skills/testing/SKILL.md) | Setup, padrões e o que testar |
| Code Review | [.claude/skills/code-review/SKILL.md](.claude/skills/code-review/SKILL.md) | Checklist de revisão antes de commitar |
| Refactor | [.claude/skills/refactor/SKILL.md](.claude/skills/refactor/SKILL.md) | Padrões de refatoração deste projeto |

---

## Hooks

| Hook | Arquivo | Quando executa |
|------|---------|----------------|
| pre-commit | [.claude/hooks/pre-commit.md](.claude/hooks/pre-commit.md) | Antes de cada commit git |

---

## Banco de dados — tabelas

### `users`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | BIGINT PK AUTO_INCREMENT | ID do usuário |
| `name` | VARCHAR(100) NOT NULL | Nome completo |
| `email` | VARCHAR(255) NOT NULL UNIQUE | Email usado no login |
| `password_hash` | VARCHAR(255) NOT NULL | Hash bcrypt, custo 12 |
| `ai_provider` | VARCHAR(50) NULL | `openai` \| `anthropic` \| `google` \| `groq` |
| `ai_api_key` | TEXT NULL | API Key criptografada AES-256-GCM |
| `created_at` | DATETIME DEFAULT NOW() | Data de criação |

### `sessions`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | VARCHAR(255) PK | ID da sessão gerado pelo Lucia Auth |
| `user_id` | BIGINT NOT NULL FK→users.id | Usuário dono da sessão |
| `expires_at` | DATETIME NOT NULL | Expiração — Lucia gerencia automaticamente |

### `reports`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | BIGINT PK AUTO_INCREMENT | ID do relatório |
| `user_id` | BIGINT NOT NULL FK→users.id | Usuário dono |
| `file_name` | VARCHAR(255) NOT NULL | Nome do arquivo original da planilha |
| `row_count` | INT NOT NULL | Total de linhas processadas |
| `columns_meta` | JSON NOT NULL | `ColumnMeta[]` — tipo inferido por coluna |
| `charts_config` | JSON NOT NULL | `ChartConfig[]` — configuração dos gráficos |
| `ai_insights` | TEXT NULL | Markdown dos insights (se IA foi usada) |
| `pdf_path` | VARCHAR(500) NULL | Caminho do PDF salvo em `uploads/` |
| `created_at` | DATETIME DEFAULT NOW() | Data de criação |

---

## Regras críticas

1. **NUNCA logar API Keys** — nem parcialmente, nem em ambiente de dev. Chaves não aparecem em logs, console ou respostas.
2. **NUNCA retornar API Key decriptografada** em endpoint — retornar apenas `hasApiKey: boolean`.
3. **NUNCA usar `any` no TypeScript** — use `unknown` com type guards. Se precisar escapar, documente o motivo com comentário.
4. **SEMPRE validar inputs no servidor com Zod** — nunca confiar em dados vindos do cliente (body, params, query).
5. **NUNCA alterar o schema do banco** sem rodar `npm run db:push` (dev) ou gerar migration com `npm run db:generate` (prod).
6. **SEMPRE usar bcrypt com custo >= 12** para hash de senhas — nunca MD5, SHA, ou custo menor.
7. **NUNCA commitar `.env.local`** ou qualquer arquivo com secrets. Verificar antes de todo commit.
8. **SEMPRE usar `user_id` da sessão do servidor** para operações de banco — nunca aceitar `userId` vindo do request body.
9. **Criptografia de API Key é exclusiva de `src/lib/crypto/apiKey.ts`** — proibido reimplementar AES em outro lugar.
10. **Arquivos de planilha ficam em disco** em `uploads/{userId}/{timestamp}-{fileName}` — nunca no banco, apenas o path.
11. **Máximo de 4 gráficos por dashboard** — chart engine não ultrapassa esse limite.
12. **Amostra de IA limitada a 50 linhas** (`AI_SAMPLE_ROWS`) — nunca enviar a planilha completa ao provider de IA.
