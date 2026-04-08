# PlanilhaDash

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![MariaDB](https://img.shields.io/badge/MariaDB-10.11-blue)

**PlanilhaDash** é um micro-SaaS open-source que transforma planilhas de negócios em dashboards visuais interativos — com autenticação de usuários, histórico de relatórios e análise de IA via sua própria chave de API.

Faça upload de qualquer planilha (vendas, RH, estoque, financeiro...), e o sistema detecta automaticamente as colunas, gera gráficos relevantes, oferece análise de IA (OpenAI, Claude, Gemini ou Groq) e salva tudo no seu histórico.

---

## Funcionalidades

- **Autenticação completa**: cadastro e login com email/senha, sessões persistidas no banco
- **Upload inteligente**: suporte a `.xlsx`, `.csv` e `.ods`
- **Detecção dinâmica de colunas**: o sistema infere tipos automaticamente (numérico, monetário, data, categórico)
- **Dashboard automático**: gráficos selecionados com base nos dados (barras, linhas, pizza, dispersão)
- **Análise de IA**: insights gerados via OpenAI, Anthropic (Claude), Google (Gemini) ou Groq — usando sua própria API Key
- **Histórico de relatórios**: todos os dashboards ficam salvos na sua conta
- **Exportação PDF**: download do dashboard completo com um clique
- **API Key segura**: armazenada criptografada (AES-256-GCM), nunca exposta em logs

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Banco de dados | MariaDB 10.11 |
| ORM | Drizzle ORM |
| Autenticação | Lucia Auth v3 |
| IA Multi-provider | Vercel AI SDK v5 |
| Gráficos | Recharts |
| Parsing XLSX | SheetJS (xlsx) |
| Parsing CSV | PapaParse |
| PDF | html2canvas + jsPDF |
| UI | Tailwind CSS + shadcn/ui |

---

## Quickstart

### Pré-requisitos
- Node.js >= 20.x
- MariaDB 10.11 rodando localmente ou em servidor

### 1. Clonar e instalar

```bash
git clone https://github.com/seu-usuario/PlanilhaDash.git
cd PlanilhaDash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
DATABASE_URL=mysql://user:password@localhost:3306/planilhadash
ENCRYPTION_KEY=<gere com o comando abaixo>
LUCIA_SECRET=<string aleatória longa>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Gerar `ENCRYPTION_KEY`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Criar banco e rodar migrations

```bash
# Criar banco no MariaDB
mysql -u root -p -e "CREATE DATABASE planilhadash CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Rodar migrations (Drizzle Kit)
npm run db:push
```

### 4. Iniciar

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Como usar

1. **Crie sua conta** ou faça login
2. **Configure sua API Key de IA** no modal que aparece ao entrar (OpenAI, Claude, Gemini, Groq — ou ignore para usar sem IA)
3. **Faça upload** da sua planilha (arraste ou clique)
4. **Visualize** o dashboard gerado automaticamente
5. **Baixe** o PDF com o dashboard e os insights
6. **Acesse o histórico** — todos os relatórios ficam salvos na sua conta

> Você pode atualizar sua API Key de IA a qualquer momento nas configurações.

---

## Estrutura do Projeto

```
PlanilhaDash/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login e cadastro
│   │   ├── (app)/              # Rotas protegidas
│   │   └── api/                # API Routes
│   ├── components/             # Componentes React
│   ├── lib/                    # Lógica de negócio
│   │   ├── auth/               # Lucia Auth
│   │   ├── db/                 # Drizzle ORM + schema
│   │   ├── crypto/             # Criptografia de API Keys
│   │   ├── ai/                 # Vercel AI SDK multi-provider
│   │   └── parser/             # Parsing de planilhas
│   └── types/
├── uploads/                    # Planilhas por usuário (local)
├── drizzle/                    # Migrations
└── docs/                       # Documentação técnica
```

---

## Documentação

- [Especificação Técnica](docs/spec.md) — arquitetura, schema do banco, auth, criptografia e IA
- [Roadmap de Features](docs/features.md) — o que está planejado e o que já existe
- [Guia para Contribuidores](docs/skills.md) — stack, padrões e como contribuir

---
