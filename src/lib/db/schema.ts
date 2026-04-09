import {
  bigint,
  datetime,
  int,
  json,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import type { ColumnMeta, ChartConfig } from "@/types/spreadsheet";

export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  aiProvider: varchar("ai_provider", { length: 50 }),
  aiApiKey: text("ai_api_key"),
  createdAt: datetime("created_at").default(sql`NOW()`),
});

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  expiresAt: datetime("expires_at").notNull(),
});

export const reports = mysqlTable("reports", {
  id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  rowCount: int("row_count").notNull(),
  columnsMeta: json("columns_meta").$type<ColumnMeta[]>().notNull(),
  chartsConfig: json("charts_config").$type<ChartConfig[]>().notNull(),
  aiInsights: text("ai_insights"),
  pdfPath: varchar("pdf_path", { length: 500 }),
  createdAt: datetime("created_at").default(sql`NOW()`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
