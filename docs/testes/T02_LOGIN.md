# T02 — Testes: Login

**Feature:** [F02_LOGIN.md](../runbooks/F02_LOGIN.md)
**Rota:** `POST /api/auth/login`

---

## Testes manuais

- [ ] Email + senha corretos → cookie de sessão setado, redirect para `/dashboard`
- [ ] Sessão persiste após fechar e reabrir o browser
- [ ] Email inexistente → status 401 + "Credenciais inválidas" (não revelar que email não existe)
- [ ] Senha errada → status 401 + "Credenciais inválidas" (mesma mensagem do email inexistente)
- [ ] Body inválido (email sem @) → status 400
- [ ] Body vazio → status 400

---

## Testes automatizados

```ts
// tests/integration/login.test.ts
describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await createUser({ email: "user@t.com", password: "12345678" });
  });

  it("retorna session cookie com credenciais válidas", async () => {
    const res = await POST({ email: "user@t.com", password: "12345678" });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/auth_session/);
  });

  it("retorna 401 com email inexistente", async () => {
    const res = await POST({ email: "ghost@t.com", password: "12345678" });
    expect(res.status).toBe(401);
  });

  it("retorna 401 com senha errada", async () => {
    const res = await POST({ email: "user@t.com", password: "senhaerrada" });
    expect(res.status).toBe(401);
  });

  it("mensagem de erro NÃO diferencia email de senha", async () => {
    const res1 = await POST({ email: "ghost@t.com", password: "12345678" });
    const res2 = await POST({ email: "user@t.com",  password: "errada" });
    const body1 = await res1.json();
    const body2 = await res2.json();
    expect(body1.error).toBe(body2.error); // mesma mensagem nos dois casos
  });
});
```

> **Regra:** usar banco real `planilhadash_test` — nunca mock.
