import { describe, it, expect } from "vitest";
import { detectProvider, getProviderLabel, getProviderLink } from "@/lib/ai/detectProvider";

describe("detectProvider", () => {
  it("detecta Google pelo prefixo AIza", () => {
    expect(detectProvider("AIzaSyDP_xJqET5QmYjSIAhDtYcJgtykBybRekM")).toBe("google");
    expect(detectProvider("AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")).toBe("google");
  });

  it("detecta Anthropic pelo prefixo sk-ant-", () => {
    expect(detectProvider("sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")).toBe("anthropic");
    expect(detectProvider("sk-ant-test")).toBe("anthropic");
  });

  it("detecta OpenAI pelo prefixo sk- (não sk-ant-)", () => {
    expect(detectProvider("sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")).toBe("openai");
    expect(detectProvider("sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")).toBe("openai");
  });

  it("detecta Groq pelo prefixo gsk_", () => {
    expect(detectProvider("gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")).toBe("groq");
  });

  it("chave com espaços extras — faz trim antes de detectar", () => {
    expect(detectProvider("  AIzaSyXXXXXX  ")).toBe("google");
    expect(detectProvider("  sk-ant-XXXX")).toBe("anthropic");
  });

  it("prefixo desconhecido cai em openai (compatível com spec OpenAI)", () => {
    expect(detectProvider("some-unknown-format-key")).toBe("openai");
    expect(detectProvider("eyJhbGciOiJIUzI1NiJ9...")).toBe("openai");
    expect(detectProvider("")).toBe("openai");
  });

  it("sk-ant- tem precedência sobre sk-", () => {
    expect(detectProvider("sk-ant-something")).toBe("anthropic");
  });
});

describe("getProviderLabel", () => {
  it("retorna labels corretos para cada provider", () => {
    expect(getProviderLabel("google")).toBe("Google Gemini");
    expect(getProviderLabel("openai")).toBe("OpenAI");
    expect(getProviderLabel("anthropic")).toBe("Anthropic Claude");
    expect(getProviderLabel("groq")).toBe("Groq");
  });
});

describe("getProviderLink", () => {
  it("retorna links corretos para cada provider", () => {
    expect(getProviderLink("google")).toBe("aistudio.google.com/apikey");
    expect(getProviderLink("openai")).toBe("platform.openai.com/api-keys");
    expect(getProviderLink("anthropic")).toBe("console.anthropic.com");
    expect(getProviderLink("groq")).toBe("console.groq.com/keys");
  });
});
