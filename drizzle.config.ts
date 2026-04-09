import type { Config } from "drizzle-kit";
import { config } from "dotenv";
import path from "path";

// Load .env.local for CLI commands
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: "127.0.0.1",
    port: 3307,
    user: "root",
    password: "root",
    database: process.env.DB_NAME ?? "planilhadash",
  },
} satisfies Config;
