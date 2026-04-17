import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";
import { analyzeWithAI } from "@/lib/ai/analyze";
import { decryptApiKey } from "@/lib/crypto/apiKey";
import { eq } from "drizzle-orm";
import { z } from "zod";

const FREE_TIER_LIMIT = Number(process.env.FREE_TIER_LIMIT ?? 3);

const analyzeSchema = z.object({
  columnsMeta: z.array(z.unknown()),
  sampleRows: z.array(z.record(z.unknown())),
  chartsConfig: z.array(z.unknown()).optional(),
});

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

  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Fetch user's AI config and free tier state from DB — userId always from session
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

  let apiKey: string;
  let provider: string;
  let isFreeTier = false;

  if (user?.aiApiKey && user?.aiProvider) {
    // User has their own key — decrypt in memory, never log
    apiKey = decryptApiKey(user.aiApiKey);
    provider = user.aiProvider;
  } else {
    // No personal key — try server-side free tier key (Groq preferred, OpenAI fallback)
    const serverKey = process.env.PLANILHA_GROQ_KEY ?? process.env.PLANILHA_OPENAI_KEY;
    const serverProvider = process.env.PLANILHA_GROQ_KEY ? "groq" : "openai";
    if (!serverKey) {
      return Response.json(
        { error: "Chave de API não configurada. Configure em Configurações." },
        { status: 400 }
      );
    }

    // Compute effective usage (reset if past the reset date)
    const now = new Date();
    const resetAt = user?.freeAnalysesResetAt ?? null;
    const usedThisMonth =
      resetAt && now > resetAt ? 0 : (user?.freeAnalysesUsed ?? 0);

    if (usedThisMonth >= FREE_TIER_LIMIT) {
      return Response.json(
        {
          error: "FREE_TIER_EXHAUSTED",
          message: `Você utilizou todas as ${FREE_TIER_LIMIT} análises gratuitas deste mês. Configure uma API Key para continuar sem limites.`,
          freeTierLimit: FREE_TIER_LIMIT,
        },
        { status: 402 }
      );
    }

    apiKey = serverKey;
    provider = serverProvider;
    isFreeTier = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columnsMeta = parsed.data.columnsMeta as any[];
  const sampleRows = parsed.data.sampleRows;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartsConfig = (parsed.data.chartsConfig ?? []) as any[];

  try {
    const insights = await analyzeWithAI(
      provider,
      apiKey,
      columnsMeta,
      sampleRows,
      chartsConfig
    );

    // Increment free tier counter after a successful analysis
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

    return Response.json({ insights });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    const msg = message.toLowerCase();

    if (msg.includes("expired") || msg.includes("api key expired")) {
      return Response.json(
        { error: "Chave de API expirada. Gere uma nova chave e configure novamente." },
        { status: 400 }
      );
    }
    if (message.includes("API_KEY_INVALID") || msg.includes("invalid api key") || message.includes("401")) {
      return Response.json(
        { error: "Chave de API inválida. Verifique a chave configurada." },
        { status: 400 }
      );
    }
    if (message.includes("PERMISSION_DENIED") || message.includes("403")) {
      return Response.json(
        { error: "Permissão negada. Verifique se a API está habilitada no seu projeto Google Cloud." },
        { status: 400 }
      );
    }
    if (msg.includes("quota") || message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      return Response.json(
        { error: "Cota da API excedida. Aguarde e tente novamente." },
        { status: 429 }
      );
    }
    if (message.includes("SERVICE_UNAVAILABLE") || message.includes("503")) {
      return Response.json(
        { error: "Serviço de IA temporariamente indisponível. Tente novamente em instantes." },
        { status: 503 }
      );
    }

    return Response.json({ error: `Erro na análise: ${message}` }, { status: 500 });
  }
}
