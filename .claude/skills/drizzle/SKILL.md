# Skill: Drizzle ORM

**Projeto:** PlanilhaDash
**Versão:** Drizzle ORM 0.36.x + Drizzle Kit 0.28.x + MariaDB 10.11

---

## Conexão (`src/lib/db/index.ts`)

```ts
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
export const db = drizzle(connection);
```

---

## Tabelas (`src/lib/db/schema.ts`)

```ts
import { bigint, datetime, int, json, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users   = mysqlTable("users",   { ... });
export const sessions = mysqlTable("sessions", { ... });
export const reports  = mysqlTable("reports",  { ... });
```

> Schema completo em [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md#drizzle-schema-typescript).

---

## Padrões de query

```ts
import { db } from "@/lib/db";
import { users, reports } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

// SELECT
const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

// INSERT com retorno de ID
const [inserted] = await db.insert(users).values({ ... }).$returningId();

// UPDATE
await db.update(users).set({ aiProvider: provider }).where(eq(users.id, userId));

// DELETE
await db.delete(sessions).where(eq(sessions.id, sessionId));

// SELECT colunas específicas (evitar SELECT *)
const rows = await db.select({
  id:       reports.id,
  fileName: reports.fileName,
}).from(reports).where(eq(reports.userId, userId)).orderBy(desc(reports.createdAt));
```

---

## Migrations

```bash
# Desenvolvimento — aplica schema diretamente (sem arquivo de migration)
npm run db:push

# Produção — gerar arquivo de migration versionado
npm run db:generate
# Revisar arquivo em drizzle/ antes de aplicar
```

**Regra:** NUNCA alterar `schema.ts` sem rodar um dos comandos acima.

---

## Drizzle Studio

```bash
npm run db:studio
# Abre UI visual em http://local.drizzle.studio
```

---

## JSON columns

```ts
// Tipar colunas JSON com $type<>()
columnsMeta:  json("columns_meta").$type<ColumnMeta[]>().notNull(),
chartsConfig: json("charts_config").$type<ChartConfig[]>().notNull(),
```

---

## Proibições

- Nunca usar `sql`` raw` para queries com input do usuário (SQL injection)
- Nunca fazer `SELECT *` em tabelas grandes — selecionar colunas explicitamente
- Nunca alterar o banco diretamente via SQL sem registrar em `docs/decisions/correcoes.md`
- Nunca commitar migrations não revisadas
