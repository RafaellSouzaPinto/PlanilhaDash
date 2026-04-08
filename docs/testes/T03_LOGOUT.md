# T03 — Testes: Logout

**Feature:** [F03_LOGOUT.md](../runbooks/F03_LOGOUT.md)
**Rota:** `POST /api/auth/logout`

---

## Testes manuais

- [ ] Clicar em "Sair" → redirect para `/login`
- [ ] Verificar banco: linha **removida** da tabela `sessions` após logout
- [ ] Após logout, acessar `/dashboard` diretamente → redirect para `/login`
- [ ] Após logout, acessar `/upload` → redirect para `/login`
- [ ] Cookie de sessão apagado (inspecionar Application > Cookies no DevTools)
- [ ] Chamar `POST /api/auth/logout` sem cookie → retorna 200 sem erro (idempotente)

---

## Testes automatizados

```ts
// tests/integration/logout.test.ts
describe("POST /api/auth/logout", () => {
  it("invalida sessão no banco", async () => {
    const { sessionId } = await loginUser({ email: "user@t.com", password: "12345678" });
    await POST_logout(sessionId);

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    expect(session).toBeUndefined(); // removido do banco
  });

  it("retorna 200 sem cookie (idempotente)", async () => {
    const res = await POST_logout(null); // sem cookie
    expect(res.status).toBe(200);
  });

  it("sessão invalidada não acessa rota protegida", async () => {
    const { sessionId } = await loginUser({ email: "user@t.com", password: "12345678" });
    await POST_logout(sessionId);
    const res = await GET("/api/reports", { cookie: `auth_session=${sessionId}` });
    expect(res.status).toBe(401);
  });
});
```

> **Regra:** usar banco real `planilhadash_test` — nunca mock.
