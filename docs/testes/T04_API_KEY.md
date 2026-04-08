# T04 — Testes: API Key de IA

**Feature:** [F04_API_KEY.md](../runbooks/F04_API_KEY.md)
**Rotas:** `GET /api/user/api-key` · `POST /api/user/api-key`

---

## Testes manuais

- [ ] Modal de API Key aparece na **primeira sessão** (hasApiKey === false)
- [ ] Modal **não reaparece** na mesma sessão após ser ignorado ou salvo
- [ ] Salvar key → verificar banco: `ai_api_key` **não está em plaintext** (`SELECT ai_api_key FROM users`)
- [ ] Verificar banco: `ai_api_key` tem formato `hex:hex:hex` (iv:tag:ciphertext)
- [ ] GET `/api/user/api-key` → retorna `{ hasApiKey: true, aiProvider: "openai" }` — **nunca a key em si**
- [ ] Trocar key por uma nova → salva e sobrescreve a anterior
- [ ] Ignorar modal → `hasApiKey` continua false, dashboard funciona sem IA
- [ ] Chamar rota sem sessão → 401

---

## Testes automatizados

```ts
// tests/integration/apiKey.test.ts
describe("POST /api/user/api-key", () => {
  it("salva key criptografada no banco", async () => {
    const { cookie } = await loginUser({ email: "user@t.com", password: "12345678" });
    await POST("/api/user/api-key", { provider: "openai", apiKey: "sk-minha-key-real" }, cookie);

    const [user] = await db.select({ aiApiKey: users.aiApiKey }).from(users).where(...);
    expect(user.aiApiKey).not.toBeNull();
    expect(user.aiApiKey).not.toContain("sk-minha-key-real"); // não em plaintext
    expect(user.aiApiKey).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/); // formato AES-GCM
  });

  it("key salva pode ser decriptografada de volta ao original", async () => {
    const original = "sk-test-key-12345";
    const encrypted = encryptApiKey(original);
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(original);
  });
});

describe("GET /api/user/api-key", () => {
  it("nunca retorna a key em plaintext", async () => {
    const res = await GET("/api/user/api-key", cookie);
    const body = await res.json();
    expect(body).not.toHaveProperty("apiKey");
    expect(body).not.toHaveProperty("ai_api_key");
    expect(body).toHaveProperty("hasApiKey");
    expect(body).toHaveProperty("aiProvider");
  });
});
```

> **Regra:** usar banco real `planilhadash_test`. Usar `ENCRYPTION_KEY` de teste separada da produção.
