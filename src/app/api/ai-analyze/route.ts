import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { validateSession } from "@/lib/auth/session";
import { analyzeWithAI } from "@/lib/ai/analyze";
import { eq } from "drizzle-orm";
import { z } from "zod";

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

  // Fetch user's AI config from DB — userId always from session
  const [user] = await db
    .select({ aiProvider: users.aiProvider, aiApiKey: users.aiApiKey })
    .from(users)
    .where(eq(users.id, validated.user.id))
    .limit(1);

  if (!user?.aiApiKey || !user?.aiProvider) {
    return Response.json(
      { error: "Chave de API não configurada. Configure em Configurações." },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columnsMeta = parsed.data.columnsMeta as any[];
  const sampleRows = parsed.data.sampleRows;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartsConfig = (parsed.data.chartsConfig ?? []) as any[];

  try {
    const insights = await analyzeWithAI(
      user.aiProvider,
      user.aiApiKey,
      columnsMeta,
      sampleRows,
      chartsConfig
    );
    return Response.json({ insights });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";

    const msg = message.toLowerCase();

    // Map common provider errors to friendly Portuguese messages
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
