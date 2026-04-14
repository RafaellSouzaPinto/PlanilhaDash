import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { encryptApiKey } from "@/lib/crypto/apiKey";
import {
  sampleColumnsMeta,
  sampleRows,
  validMockAIResponse,
  invalidJsonResponse,
  emptyArrayResponse,
  responseWithInvalidColumns,
  responseWithInvalidChartType,
  mixedValidInvalidResponse,
} from "../fixtures/m08";

beforeAll(() => {
  process.env.ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

// Mock Vercel AI SDK and provider SDKs
vi.mock("ai", () => ({ generateText: vi.fn() }));
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => vi.fn(() => "mock-model-openai")),
}));
vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn(() => vi.fn(() => "mock-model-anthropic")),
}));
vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => "mock-model-google")),
}));
vi.mock("@ai-sdk/groq", () => ({
  createGroq: vi.fn(() => vi.fn(() => "mock-model-groq")),
}));

describe("suggestChartsWithAI()", () => {
  const encryptedKey = encryptApiKey("sk-test-unit");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("T-U01: retorna sugestões válidas quando a IA responde com JSON correto", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText).mockResolvedValue({ text: validMockAIResponse } as never);

    const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");
    const result = await suggestChartsWithAI(
      "openai",
      encryptedKey,
      sampleColumnsMeta,
      sampleRows
    );

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe("bar");
    expect(result[0].xKey).toBe("região");
    expect(result[0].yKey).toBe("total_vendas");
    expect(result[0].priority).toBe(1);
    // Ordered by priority
    expect(result[0].priority).toBeLessThan(result[1].priority);
    expect(result[1].priority).toBeLessThan(result[2].priority);
    expect(vi.mocked(generateText)).toHaveBeenCalledTimes(1);
  });

  it("T-U02: lança erro quando a IA retorna JSON inválido", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText).mockResolvedValue({ text: invalidJsonResponse } as never);

    const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");
    await expect(
      suggestChartsWithAI("openai", encryptedKey, sampleColumnsMeta, sampleRows)
    ).rejects.toThrow("JSON inválido");
  });

  it("T-U03: retorna array vazio quando a IA retorna []", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText).mockResolvedValue({ text: emptyArrayResponse } as never);

    const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");
    const result = await suggestChartsWithAI(
      "openai",
      encryptedKey,
      sampleColumnsMeta,
      sampleRows
    );

    expect(result).toEqual([]);
  });

  it("T-U04: descarta itens com colunas inexistentes em columnsMeta", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText).mockResolvedValue({
      text: responseWithInvalidColumns,
    } as never);

    const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");
    const result = await suggestChartsWithAI(
      "openai",
      encryptedKey,
      sampleColumnsMeta,
      sampleRows
    );

    expect(result).toEqual([]);
  });

  it("T-U05: descarta itens com type não reconhecido", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText).mockResolvedValue({
      text: responseWithInvalidChartType,
    } as never);

    const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");
    const result = await suggestChartsWithAI(
      "openai",
      encryptedKey,
      sampleColumnsMeta,
      sampleRows
    );

    expect(result).toEqual([]);
  });

  it("T-U06: descarta apenas itens inválidos, preserva os válidos", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText).mockResolvedValue({
      text: mixedValidInvalidResponse,
    } as never);

    const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");
    const result = await suggestChartsWithAI(
      "openai",
      encryptedKey,
      sampleColumnsMeta,
      sampleRows
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("bar");
    expect(result[0].xKey).toBe("região");
  });

  it("T-U07: tenta fallback de modelo quando Google retorna 'not found'", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText)
      .mockRejectedValueOnce(new Error("model not found"))
      .mockResolvedValueOnce({ text: validMockAIResponse } as never);

    const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");
    const result = await suggestChartsWithAI(
      "google",
      encryptedKey,
      sampleColumnsMeta,
      sampleRows
    );

    expect(result).toHaveLength(3);
    expect(vi.mocked(generateText)).toHaveBeenCalledTimes(2);
  });

  it("T-U08: lança imediatamente em erros de autenticação sem retry", async () => {
    const { generateText } = await import("ai");
    vi.mocked(generateText).mockRejectedValue(
      new Error("Incorrect API key provided")
    );

    const { suggestChartsWithAI } = await import("@/lib/ai/suggestCharts");
    await expect(
      suggestChartsWithAI("openai", encryptedKey, sampleColumnsMeta, sampleRows)
    ).rejects.toThrow("Incorrect API key provided");

    expect(vi.mocked(generateText)).toHaveBeenCalledTimes(1);
  });
});
