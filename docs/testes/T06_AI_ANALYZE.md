# T06 — Testes: Análise de IA

**Feature:** [F06_AI_ANALYZE.md](../runbooks/F06_AI_ANALYZE.md)
**Rota:** `POST /api/ai-analyze`

---

## Testes manuais

- [ ] Com key OpenAI válida → insights gerados em Markdown, exibidos no InsightsPanel
- [ ] Com key Anthropic válida → insights gerados
- [ ] Com key Google (Gemini) válida → insights gerados
- [ ] Com key Groq válida → insights gerados
- [ ] **Sem** API Key configurada → mensagem "Configure sua API Key" visível, dashboard funciona normalmente
- [ ] Key inválida (ex: "sk-invalida") → erro amigável no InsightsPanel, sem expor detalhes técnicos
- [ ] Verificar: nenhuma key aparece nos logs do servidor
- [ ] Verificar: resposta da API **não contém** a key em nenhum campo
- [ ] Amostra enviada: verificar no payload da request que `sample.length <= 50`
- [ ] Chamar rota sem sessão → 401

---

## Testes automatizados

```ts
// tests/unit/crypto.test.ts
describe("encryptApiKey / decryptApiKey", () => {
  it("decripta de volta ao valor original", () => {
    const original  = "sk-test-abcdefghij";
    const encrypted = encryptApiKey(original);
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(original);
  });

  it("dois encrypts da mesma key geram ciphertexts diferentes (IV aleatório)", () => {
    const key  = "sk-test-key";
    const enc1 = encryptApiKey(key);
    const enc2 = encryptApiKey(key);
    expect(enc1).not.toBe(enc2);
  });

  it("formato é iv:tag:ciphertext (3 partes hex)", () => {
    const encrypted = encryptApiKey("sk-test");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    parts.forEach(p => expect(p).toMatch(/^[0-9a-f]+$/));
  });
});

// tests/integration/aiAnalyze.test.ts
describe("POST /api/ai-analyze", () => {
  it("retorna 400 se usuário não tem API Key configurada", async () => {
    const { cookie } = await loginUserWithoutApiKey();
    const res = await POST("/api/ai-analyze", validPayload, cookie);
    expect(res.status).toBe(400);
  });

  it("retorna 401 sem sessão", async () => {
    const res = await POST("/api/ai-analyze", validPayload, null);
    expect(res.status).toBe(401);
  });

  // Para testar com provider real: usar key de teste, mockar o Vercel AI SDK
  it("chama o provider correto com a key decriptografada", async () => {
    // mock do generateText do Vercel AI SDK
    const mockGenerate = jest.spyOn(aiSdk, "generateText").mockResolvedValue({ text: "insights mockados" });
    const { cookie } = await loginUserWithApiKey({ provider: "openai", apiKey: "sk-test" });

    const res = await POST("/api/ai-analyze", validPayload, cookie);
    expect(res.status).toBe(200);
    expect(mockGenerate).toHaveBeenCalled();
    // verificar que a key chegou decriptografada corretamente
    const callArgs = mockGenerate.mock.calls[0][0];
    expect(JSON.stringify(callArgs)).not.toContain("sk-test"); // key não exposta em logs
  });
});
```

> **Nota:** testes com providers reais (OpenAI, Anthropic, etc.) devem ser executados manualmente ou em CI com secrets configurados — nunca hardcodar keys nos testes.
