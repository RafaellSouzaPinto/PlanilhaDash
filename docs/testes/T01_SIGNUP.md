# T01 — Testes: Signup

**Feature:** [F01_SIGNUP.md](../runbooks/F01_SIGNUP.md)
**Rota:** `POST /api/auth/signup`

---

## Testes manuais

- [ ] Dados válidos (name, email, password >= 8) → redireciona para `/dashboard`
- [ ] Verificar banco: linha criada em `users` com `password_hash` começando com `$2b$` (bcrypt)
- [ ] Verificar banco: `password_hash` **não contém** a senha em plaintext
- [ ] Verificar banco: linha criada em `sessions` após signup
- [ ] Email duplicado → status 409 + mensagem "Email já cadastrado"
- [ ] Senha com 7 caracteres → erro de validação (400), usuário não criado
- [ ] Email inválido (sem @) → erro de validação (400)
- [ ] Name vazio → erro de validação (400)
- [ ] Usuário recém-cadastrado já está logado (sem precisar fazer login separado)

---

## Testes automatizados

```ts
// tests/integration/signup.test.ts
describe("POST /api/auth/signup", () => {
  it("cria usuário e sessão com dados válidos", async () => {
    const res = await POST({ name: "Test", email: "t@t.com", password: "12345678" });
    expect(res.status).toBe(200);
    // verificar no banco real
    const [user] = await db.select().from(users).where(eq(users.email, "t@t.com"));
    expect(user).toBeDefined();
    expect(user.passwordHash).toMatch(/^\$2b\$/);
    const [session] = await db.select().from(sessions).where(eq(sessions.userId, user.id));
    expect(session).toBeDefined();
  });

  it("retorna 409 para email duplicado", async () => {
    await createUser({ email: "dup@t.com" });
    const res = await POST({ email: "dup@t.com", password: "12345678" });
    expect(res.status).toBe(409);
  });

  it("retorna 400 para senha com menos de 8 chars", async () => {
    const res = await POST({ email: "new@t.com", password: "123" });
    expect(res.status).toBe(400);
  });

  it("nunca salva senha em plaintext no banco", async () => {
    await POST({ email: "sec@t.com", password: "minha_senha_secreta" });
    const [user] = await db.select().from(users).where(eq(users.email, "sec@t.com"));
    expect(user.passwordHash).not.toContain("minha_senha_secreta");
  });
});
```

> **Regra:** usar banco real `planilhadash_test` — nunca mock.
