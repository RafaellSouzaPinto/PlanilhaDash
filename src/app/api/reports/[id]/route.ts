import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";
import { and, eq } from "drizzle-orm";

/**
 * GET /api/reports/[id]
 * Returns a specific report.
 * Returns 403 if the report belongs to a different user.
 * Returns 404 if the report does not exist.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const validated = await validateSession();
  if (!validated) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const reportId = Number(params.id);
  if (!Number.isInteger(reportId) || reportId <= 0) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }

  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!report) {
    return Response.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  // Ownership check — never return another user's report
  if (report.userId !== validated.user.id) {
    return Response.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Drizzle + mysql2 pode retornar colunas json como string — garantir array na resposta
  return Response.json({
    ...report,
    columnsMeta: typeof report.columnsMeta === "string"
      ? JSON.parse(report.columnsMeta)
      : report.columnsMeta,
    chartsConfig: typeof report.chartsConfig === "string"
      ? JSON.parse(report.chartsConfig)
      : report.chartsConfig,
  });
}
