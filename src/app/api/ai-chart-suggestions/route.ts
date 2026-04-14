import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";
import { suggestChartsWithAI } from "@/lib/ai/suggestCharts";
import { buildChartConfigs } from "@/lib/chartEngine";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ChartSuggestion, ColumnMeta } from "@/types/spreadsheet";

const chartSuggestionsRequestSchema = z.object({
  columnsMeta: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.enum([
          "number",
          "currency",
          "percentage",
          "date",
          "categorical",
          "text",
        ]),
        stats: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
          uniqueCount: z.number().int().nonnegative(),
          sampleValues: z.array(z.unknown()),
        }),
      })
    )
    .min(1)
    .max(100),
  sampleRows: z.array(z.record(z.unknown())).max(50),
});

function configToSuggestion(
  config: import("@/types/spreadsheet").ChartConfig,
  index: number
): ChartSuggestion {
  return {
    type: config.type,
    xKey: config.xKey,
    yKey: config.yKey,
    title: config.title,
    rationale: "",
    priority: index + 1,
  };
}

export async function POST(req: Request): Promise<Response> {
  const validated = await validateSession();
  if (!validated) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "Corpo da requisição inválido" },
      { status: 400 }
    );
  }

  const parsed = chartSuggestionsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const [user] = await db
    .select({ aiProvider: users.aiProvider, aiApiKey: users.aiApiKey })
    .from(users)
    .where(eq(users.id, validated.user.id))
    .limit(1);

  if (!user?.aiApiKey || !user?.aiProvider) {
    return Response.json(
      { error: "Chave de API não configurada." },
      { status: 400 }
    );
  }

  const columnsMeta = parsed.data.columnsMeta as ColumnMeta[];
  const sampleRows = parsed.data.sampleRows;

  try {
    const suggestions = await suggestChartsWithAI(
      user.aiProvider,
      user.aiApiKey,
      columnsMeta,
      sampleRows
    );

    if (suggestions.length === 0) {
      const fallbackConfigs = buildChartConfigs(columnsMeta, sampleRows);
      return Response.json({
        suggestions: fallbackConfigs.map(configToSuggestion),
        fallback: true,
        fallbackReason: "A IA não retornou sugestões para esta planilha.",
      });
    }

    return Response.json({
      suggestions,
      fallback: false,
      fallbackReason: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    const fallbackConfigs = buildChartConfigs(columnsMeta, sampleRows);
    return Response.json({
      suggestions: fallbackConfigs.map(configToSuggestion),
      fallback: true,
      fallbackReason: message,
    });
  }
}
