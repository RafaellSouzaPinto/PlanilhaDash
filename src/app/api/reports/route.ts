import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const saveReportSchema = z.object({
  fileName: z.string().min(1).max(255),
  rowCount: z.number().int().positive(),
  columnsMeta: z.array(z.unknown()),
  chartsConfig: z.array(z.unknown()),
  aiInsights: z.string().optional(),
});

/**
 * GET /api/reports
 * Lists the authenticated user's reports ordered by newest first.
 */
export async function GET() {
  const validated = await validateSession();
  if (!validated) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: reports.id,
      fileName: reports.fileName,
      rowCount: reports.rowCount,
      aiInsights: reports.aiInsights,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .where(eq(reports.userId, validated.user.id))
    .orderBy(desc(reports.createdAt));

  // RN: nunca retornar o texto de insights na listagem — apenas boolean
  const userReports = rows.map((r) => ({
    id: r.id,
    fileName: r.fileName,
    rowCount: r.rowCount,
    hasAiInsights: r.aiInsights !== null,
    createdAt: r.createdAt,
  }));

  return Response.json(userReports);
}

/**
 * POST /api/reports
 * Saves a new report. userId always comes from session.
 */
export async function POST(req: Request) {
  const validated = await validateSession();
  if (!validated) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const parsed = saveReportSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { fileName, rowCount, columnsMeta, chartsConfig, aiInsights } =
    parsed.data;

  const [inserted] = await db
    .insert(reports)
    .values({
      userId: validated.user.id,
      fileName,
      rowCount,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      columnsMeta: columnsMeta as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chartsConfig: chartsConfig as any,
      aiInsights: aiInsights ?? null,
    })
    .$returningId();

  return Response.json({ id: inserted.id });
}
