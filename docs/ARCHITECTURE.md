# ARCHITECTURE.md — PlanilhaDash

> Banco de dados, rotas, regras de negócio e relacionamentos.

---

## Diagrama de Fluxo

```
[Browser]
   │
   ├─ (auth)/login  ──────────── POST /api/auth/login
   ├─ (auth)/signup ──────────── POST /api/auth/signup
   │                                    │
   │                               Lucia Auth v3
   │                               + bcrypt (custo 12)
   │                                    │
   │                               MariaDB 10.11
   │                               Drizzle ORM 0.36.x
   │
   ├─ (app)/upload ────────────  [Dropzone → Parser]
   │                                    │
   │                             SheetJS (XLSX/ODS)
   │                             PapaParse (CSV)
   │                                    │
   │                             inferTypes.ts
   │                             (classifica colunas)
   │                                    │
   │                             chartEngine.ts
   │                             (seleciona gráficos)
   │                                    │
   │                             [Dashboard Recharts]
   │                                    │
   │                    ┌───────────────┴────────────────┐
   │                    │                                │
   │            POST /api/ai-analyze            pdfExport.ts
   │            Vercel AI SDK v5                html2canvas
   │            (key do usuário)                + jsPDF
   │            decriptografada                         │
   │            em memória                      [PDF download]
   │                    │
   │            POST /api/reports
   │            (salvar no banco)
   │
   └─ (app)/dashboard ─────────── GET /api/reports
      (histórico)                 GET /api/reports/[id]
```

---

## Banco de Dados (MariaDB 10.11)

### Schema SQL completo

```sql
CREATE TABLE users (
  id            BIGINT        PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,           -- bcrypt, custo 12
  ai_provider   VARCHAR(50)   DEFAULT NULL,       -- 'openai'|'anthropic'|'google'|'groq'
  ai_api_key    TEXT          DEFAULT NULL,       -- AES-256-GCM criptografado
  created_at    DATETIME      DEFAULT NOW()
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE sessions (
  id         VARCHAR(255) PRIMARY KEY,
  user_id    BIGINT       NOT NULL,
  expires_at DATETIME     NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE reports (
  id            BIGINT        PRIMARY KEY AUTO_INCREMENT,
  user_id       BIGINT        NOT NULL,
  file_name     VARCHAR(255)  NOT NULL,
  row_count     INT           NOT NULL,
  columns_meta  JSON          NOT NULL,   -- ColumnMeta[]
  charts_config JSON          NOT NULL,   -- ChartConfig[]
  ai_insights   TEXT          DEFAULT NULL,
  pdf_path      VARCHAR(500)  DEFAULT NULL,
  created_at    DATETIME      DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Drizzle Schema (TypeScript)

Localização: `src/lib/db/schema.ts`

```ts
import { bigint, datetime, int, json, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable("users", {
  id:           bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  name:         varchar("name", { length: 100 }).notNull(),
  email:        varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  aiProvider:   varchar("ai_provider", { length: 50 }),
  aiApiKey:     text("ai_api_key"),
  createdAt:    datetime("created_at").default(sql`NOW()`),
});

export const sessions = mysqlTable("sessions", {
  id:        varchar("id", { length: 255 }).primaryKey(),
  userId:    bigint("user_id", { mode: "number" }).notNull().references(() => users.id),
  expiresAt: datetime("expires_at").notNull(),
});

export const reports = mysqlTable("reports", {
  id:           bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  userId:       bigint("user_id", { mode: "number" }).notNull().references(() => users.id),
  fileName:     varchar("file_name", { length: 255 }).notNull(),
  rowCount:     int("row_count").notNull(),
  columnsMeta:  json("columns_meta").$type<ColumnMeta[]>().notNull(),
  chartsConfig: json("charts_config").$type<ChartConfig[]>().notNull(),
  aiInsights:   text("ai_insights"),
  pdfPath:      varchar("pdf_path", { length: 500 }),
  createdAt:    datetime("created_at").default(sql`NOW()`),
});
```

### Relacionamentos

```
users (1) ──< sessions (N)   ON DELETE CASCADE
users (1) ──< reports  (N)   ON DELETE CASCADE
```

---

## API Routes

| Método | Rota | Descrição | Auth obrigatório |
|--------|------|-----------|:---:|
| POST | `/api/auth/signup` | Criar conta (name, email, password) | Não |
| POST | `/api/auth/login` | Login — retorna cookie de sessão | Não |
| POST | `/api/auth/logout` | Invalida sessão no banco | Sim |
| GET | `/api/user/api-key` | Retorna `{ hasApiKey: boolean, aiProvider: string \| null }` | Sim |
| POST | `/api/user/api-key` | Salva/atualiza API Key criptografada | Sim |
| GET | `/api/reports` | Lista relatórios do usuário autenticado | Sim |
| POST | `/api/reports` | Salva novo relatório após geração de dashboard | Sim |
| GET | `/api/reports/[id]` | Busca relatório específico (valida ownership) | Sim |
| POST | `/api/ai-analyze` | Analisa planilha com IA usando key do usuário | Sim |

### Regras de negócio por rota

**POST `/api/auth/signup`**
- Validar email único: se já existe → `409 Conflict`
- `bcrypt.hash(password, 12)` antes de inserir
- Criar sessão com Lucia imediatamente após cadastro

**POST `/api/auth/login`**
- Buscar usuário por email → `404` se não existe
- `bcrypt.compare()` → `401` se senha errada
- `lucia.createSession()` → setar cookie

**POST `/api/user/api-key`**
- Nunca aceitar `userId` do body — usar sessão
- Criptografar com `encryptApiKey()` antes de persistir
- Nunca logar o valor em plaintext

**GET `/api/reports/[id]`**
- Verificar `report.userId === session.userId` → `403` se diferente
- Nunca retornar relatórios de outros usuários

**POST `/api/ai-analyze`**
- Buscar `ai_api_key` do banco, decriptografar em memória
- Descartar key após uso (não cachear)
- Enviar no máximo `AI_SAMPLE_ROWS` (50) linhas ao provider
- Se `ai_api_key` for null → `400 Bad Request` com mensagem clara

---

## Autenticação (Lucia Auth v3)

### Fluxo de Signup
1. Validar email único no banco
2. `bcrypt.hash(password, 12)` → `password_hash`
3. `db.insert(users)` → obter `userId`
4. `lucia.createSession(userId, {})` → `sessionCookie`
5. `cookies().set(sessionCookie)` → redirecionar para `/dashboard`

### Fluxo de Login
1. `db.select(users).where(eq(users.email, email))`
2. `bcrypt.compare(password, user.passwordHash)` → `401` se falso
3. `lucia.createSession(userId, {})` → `sessionCookie`
4. `cookies().set(sessionCookie)` → redirecionar para `/dashboard`

### Fluxo de Logout
1. `lucia.invalidateSession(sessionId)` — remove do banco
2. Criar cookie em branco para sobrescrever o existente
3. Redirecionar para `/login`

### Middleware de proteção (`src/middleware.ts`)
- Rotas em `(app)/*` exigem sessão válida
- Se não autenticado → redirect para `/login`
- Se autenticado em `/login` ou `/signup` → redirect para `/dashboard`

---

## Criptografia de API Key (AES-256-GCM)

Localização: `src/lib/crypto/apiKey.ts`

**Formato armazenado no banco:**
```
{iv_hex}:{authTag_hex}:{ciphertext_hex}
```

**Variável de ambiente obrigatória:**
```env
ENCRYPTION_KEY=<64 chars hex = 32 bytes>
```

**Regras inegociáveis:**
- `ENCRYPTION_KEY` nunca vai ao cliente (nunca em `NEXT_PUBLIC_*`)
- A key decriptografada nunca aparece em logs
- A key nunca é retornada em respostas de API (apenas `hasApiKey: boolean`)
- Usar **somente** `encryptApiKey()` / `decryptApiKey()` de `src/lib/crypto/apiKey.ts`

---

## Módulo de Parser (`src/lib/parser/`)

| Formato | Biblioteca | Entry point |
|---------|-----------|-------------|
| `.csv` | PapaParse 5.x | `csvParser.ts` |
| `.xlsx` | SheetJS 0.20.x | `xlsxParser.ts` |
| `.ods` | SheetJS 0.20.x | `xlsxParser.ts` (mesmo fluxo) |

**Limites:**
- Tamanho máximo: `MAX_FILE_SIZE_MB` (padrão: 10MB)
- Apenas a primeira sheet é processada no MVP
- Arquivos salvos em `uploads/{userId}/{timestamp}-{originalName}`

---

## Inferência de Tipos (`src/lib/inferTypes.ts`)

Analisa os primeiros 100 valores não-nulos de cada coluna.

| Prioridade | Tipo detectado | Critério |
|:---:|---|---|
| 1 | `currency` | >= 80% contêm símbolo de moeda (R$, $, €, £, ¥) |
| 2 | `percentage` | >= 80% terminam em `%` |
| 3 | `date` | >= 80% batem em padrões ISO / BR / US de data |
| 4 | `number` | >= 80% são numéricos puros |
| 5 | `categorical` | cardinalidade / total < 20% (poucos valores únicos) |
| 6 | `text` | padrão / fallback |

---

## Chart Engine (`src/lib/chartEngine.ts`)

Máximo de **4 gráficos** por dashboard.

| Coluna X | Coluna Y | Gráfico gerado |
|----------|----------|----------------|
| `date` | `number` / `currency` | Linha temporal |
| `categorical` | `number` / `currency` | Barras verticais |
| `categorical` (≤ 8 únicos) | — | Pizza/Donut |
| `number` | `number` | Dispersão |
| `percentage` | qualquer | Barras horizontais |
| — | — | Tabela (fallback) |

---

## IA Multi-Provider (Vercel AI SDK v5)

Localização: `src/lib/ai/analyze.ts`

| Provider | ID no banco | Modelo padrão |
|---------|-------------|--------------|
| OpenAI | `openai` | `gpt-4o-mini` |
| Anthropic | `anthropic` | `claude-3-haiku-20240307` |
| Google | `google` | `gemini-1.5-flash` |
| Groq | `groq` | `llama-3.1-8b-instant` |

**Fluxo:**
1. Rota `/api/ai-analyze` valida sessão
2. Busca `ai_provider` + `ai_api_key` do banco
3. Decripta key em memória com `decryptApiKey()`
4. Constrói provider via Vercel AI SDK
5. Envia prompt com metadados + amostra (50 linhas)
6. Retorna Markdown com insights
7. Key descartada após a resposta — nunca cacheada

---

## Armazenamento de Arquivos

- Planilhas em: `uploads/{userId}/{timestamp}-{fileName}` (disco local)
- Apenas metadados e resultados ficam no banco
- Para produção multi-servidor: substituir por S3/MinIO/Cloudflare R2

---

## Variáveis de Ambiente

```env
# Obrigatórias
DATABASE_URL=mysql://user:password@localhost:3306/planilhadash
ENCRYPTION_KEY=<64 chars hex — 32 bytes>
LUCIA_SECRET=<string aleatória longa>

# Opcionais (com defaults)
NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_FILE_SIZE_MB=10
AI_SAMPLE_ROWS=50
```
