import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";
import { suggestChartsWithAI } from "@/lib/ai/suggestCharts";
import { decryptApiKey } from "@/lib/crypto/apiKey";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ColumnMeta } from "@/types/spreadsheet";

const FREE_TIER_LIMIT = Number(process.env.FREE_TIER_LIMIT ?? 3);

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
    .select({
      aiProvider: users.aiProvider,
      aiApiKey: users.aiApiKey,
      freeAnalysesUsed: users.freeAnalysesUsed,
      freeAnalysesResetAt: users.freeAnalysesResetAt,
    })
    .from(users)
    .where(eq(users.id, Number(validated.user.id)))
    .limit(1);

  const columnsMeta = parsed.data.columnsMeta as ColumnMeta[];
  const sampleRows = parsed.data.sampleRows;

  // Resolve which key to use and whether this counts against free tier
  let apiKey: string | null = null;
  let provider: string | null = null;
  let isFreeTier = false;

  if (user?.aiApiKey && user?.aiProvider) {
    apiKey = decryptApiKey(user.aiApiKey);
    provider = user.aiProvider;
  } else if (process.env.PLANILHA_GROQ_KEY) {
    apiKey = process.env.PLANILHA_GROQ_KEY;
    provider = "groq";
    isFreeTier = true;
  } else if (process.env.PLANILHA_OPENAI_KEY) {
    apiKey = process.env.PLANILHA_OPENAI_KEY;
    provider = "openai";
    isFreeTier = true;
  }

  // No key available at all
  if (!apiKey || !provider) {
    return Response.json(
      { error: "Nenhuma chave de IA configurada." },
      { status: 400 }
    );
  }

  // Check free tier limit before calling AI
  if (isFreeTier) {
    const now = new Date();
    const resetAt = user?.freeAnalysesResetAt ?? null;
    const usedThisMonth =
      resetAt && now > resetAt ? 0 : (user?.freeAnalysesUsed ?? 0);

    if (usedThisMonth >= FREE_TIER_LIMIT) {
      return Response.json(
        {
          error: "FREE_TIER_EXHAUSTED",
          message: `Você utilizou todas as ${FREE_TIER_LIMIT} análises gratuitas deste mês.`,
          freeTierLimit: FREE_TIER_LIMIT,
        },
        { status: 402 }
      );
    }
  }

  try {
    const suggestions = await suggestChartsWithAI(
      provider,
      apiKey,
      columnsMeta,
      sampleRows
    );

    // Increment free tier counter after successful AI call
    if (isFreeTier) {
      const now = new Date();
      const resetAt = user?.freeAnalysesResetAt ?? null;
      const needsReset = !resetAt || now > resetAt;
      const currentUsed = needsReset ? 0 : (user?.freeAnalysesUsed ?? 0);
      const nextResetAt = new Date(now);
      nextResetAt.setMonth(nextResetAt.getMonth() + 1);

      try {
        await db
          .update(users)
          .set({
            freeAnalysesUsed: currentUsed + 1,
            freeAnalysesResetAt: needsReset ? nextResetAt : resetAt!,
          })
          .where(eq(users.id, Number(validated.user.id)));
      } catch {
        // DB update failure should not block the response
      }
    }

    if (suggestions.length === 0) {
      return Response.json(
        { error: "A IA não retornou sugestões para esta planilha." },
        { status: 422 }
      );
    }

    return Response.json({
      suggestions,
      fallback: false,
      fallbackReason: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return Response.json(
      { error: `Erro na geração de gráficos: ${message}` },
      { status: 500 }
    );
  }
}
