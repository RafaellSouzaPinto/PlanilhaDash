# PlanilhaDash

Ferramenta open source para pequenas empresas visualizarem seus dados financeiros.
Suba uma planilha Excel ou CSV e gere dashboards visuais — sem custo, sem assinatura.

![License](https://img.shields.io/badge/licença-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

---

## Screenshots

<!-- quando os gráficos estiverem prontos, coloca prints aqui -->

---

## Funcionalidades

- [x] Upload de planilhas `.xlsx` e `.csv`
- [x] Geração automática de dashboard com gráficos (barras, linhas, pizza)
- [x] Dois modos: **com IA** (interpreta planilhas bagunçadas) e **sem IA** (template padronizado)
- [x] IA com sua própria chave — OpenAI, Anthropic (Claude), Google (Gemini) ou Groq
- [x] Histórico de relatórios por usuário
- [x] Exportação PDF
- [ ] Logo da empresa no PDF exportado
- [ ] Demo online

---

## Stack

- Next.js 14 + TypeScript
- Recharts (gráficos)
- MariaDB + Drizzle ORM
- Vercel AI SDK (multi-provider)
- Tailwind CSS + shadcn/ui

---

## Instalação

**Pré-requisitos:** Node.js >= 20, MariaDB 10.11

```bash
git clone https://github.com/RafaellSouzaPinto/PlanilhaDash.git
cd PlanilhaDash
npm install
cp .env.example .env.local
```

Gere as chaves obrigatórias:

```bash
# ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# LUCIA_SECRET
openssl rand -base64 32
```

Crie o banco e aplique o schema:

```bash
mysql -u root -p -e "CREATE DATABASE planilhadash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npm run db:push
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Variáveis de ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|:-----------:|
| `DATABASE_URL` | URL de conexão MariaDB | ✅ |
| `ENCRYPTION_KEY` | Chave AES-256-GCM — 64 chars hex | ✅ |
| `LUCIA_SECRET` | Segredo de sessão | ✅ |
| `NEXT_PUBLIC_APP_URL` | URL pública (padrão: localhost:3000) | Não |
| `MAX_FILE_SIZE_MB` | Limite de upload em MB (padrão: 10) | Não |
| `AI_SAMPLE_ROWS` | Linhas enviadas à IA (padrão: 50) | Não |
| `FREE_TIER_LIMIT` | Análises gratuitas por usuário (padrão: 3) | Não |
| `PLANILHA_OPENAI_KEY` | Chave OpenAI para análises gratuitas | Não |

---

## Como contribuir

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona feature X'`)
4. Push pra branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

Veja o [CONTRIBUTING.md](CONTRIBUTING.md) para mais detalhes.
Olhe as issues abertas — tem bastante coisa com `good first issue`.

---

## Licença

MIT — veja [LICENSE](LICENSE)
