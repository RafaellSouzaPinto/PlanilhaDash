# T11 — Testes: Landing Page

**Feature:** [M07_LANDING_PAGE.md](../modulos/M07_LANDING_PAGE.md)

---

## Testes manuais

### Acesso e redirect

- [ ] Visitante não autenticado acessa `/` → landing page renderiza (não redireciona)
- [ ] Usuário autenticado acessa `/` → redireciona para `/dashboard` sem piscar a landing
- [ ] Usuário autenticado faz logout → volta para `/login` (não para a landing)
- [ ] `/login` e `/signup` continuam acessíveis normalmente a partir dos botões da Navbar

### Navbar

- [ ] Logo "PlanilhaDash" visível no topo esquerdo com ícone
- [ ] Botão "Entrar" → navega para `/login`
- [ ] Botão "Criar conta" → navega para `/signup`
- [ ] Navbar permanece visível ao rolar a página (`sticky top-0`)
- [ ] Em mobile (375px): ambos os botões visíveis, sem overflow

### Hero Section

- [ ] Headline principal renderiza em destaque (`text-4xl`+)
- [ ] Subtítulo com descrição do produto visível abaixo da headline
- [ ] Botão "Começar grátis" → navega para `/signup`
- [ ] Botão "Ver demonstração" → rola suavemente até a seção `#como-funciona`
- [ ] Badges "✓ Sem cartão de crédito" e "✓ Open source" visíveis
- [ ] Fundo com gradiente renderiza sem quebra visual

### Features Section

- [ ] Seção exibe 6 cards de funcionalidades
- [ ] Cada card tem ícone, título e descrição
- [ ] Grid com 3 colunas no desktop (>= lg)
- [ ] Grid com 2 colunas no tablet (sm–lg)
- [ ] Stack de 1 coluna no mobile (< sm)
- [ ] Título da seção legível e alinhado

### How It Works Section

- [ ] ID `como-funciona` presente no elemento raiz da seção (âncora do Hero)
- [ ] 3 etapas exibidas com número, título e descrição
- [ ] Linha tracejada de conexão visível entre etapas no desktop
- [ ] Linha tracejada oculta no mobile (stack vertical)
- [ ] Scroll suave a partir do botão do Hero chega na seção corretamente

### CTA Section

- [ ] Banner com fundo `bg-primary` renderiza sem quebra
- [ ] Título e subtítulo legíveis sobre o fundo escuro (contraste adequado)
- [ ] Botão "Criar conta grátis →" → navega para `/signup`

### Footer

- [ ] Logo repetido no rodapé
- [ ] Links "GitHub" e "Documentação" visíveis
- [ ] Copyright "© 2025 PlanilhaDash" exibido
- [ ] Nenhum link quebrado no footer

### Performance e acessibilidade

- [ ] Página carrega sem chamadas de API (verificar Network tab: zero requests além do HTML/CSS/JS)
- [ ] Nenhum dado de sessão, cookie ou usuário exposto no HTML fonte
- [ ] Sem erros no console do navegador
- [ ] Heading hierarchy correta: `h1` no Hero, `h2` nas seções
- [ ] Todos os botões têm texto descritivo (sem ícones sem `aria-label`)

---

## Testes automatizados

### Unit — componentes de marketing

```ts
// tests/unit/marketing/HeroSection.test.tsx
import { render, screen } from "@testing-library/react";
import { HeroSection } from "@/components/marketing/HeroSection";

describe("HeroSection", () => {
  it("renderiza headline principal", () => {
    render(<HeroSection />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("botão primário aponta para /signup", () => {
    render(<HeroSection />);
    const link = screen.getByRole("link", { name: /começar grátis/i });
    expect(link).toHaveAttribute("href", "/signup");
  });

  it("botão secundário tem href para âncora #como-funciona", () => {
    render(<HeroSection />);
    const link = screen.getByRole("link", { name: /ver demonstração/i });
    expect(link).toHaveAttribute("href", "#como-funciona");
  });
});
```

```ts
// tests/unit/marketing/FeaturesSection.test.tsx
import { render, screen } from "@testing-library/react";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";

describe("FeaturesSection", () => {
  it("renderiza exatamente 6 cards de funcionalidade", () => {
    render(<FeaturesSection />);
    // Cada card tem um heading — verificar a contagem
    const cards = screen.getAllByRole("heading", { level: 3 });
    expect(cards).toHaveLength(6);
  });
});
```

```ts
// tests/unit/marketing/Navbar.test.tsx
import { render, screen } from "@testing-library/react";
import { Navbar } from "@/components/marketing/Navbar";

describe("Navbar", () => {
  it("renderiza logo PlanilhaDash", () => {
    render(<Navbar />);
    expect(screen.getByText("PlanilhaDash")).toBeInTheDocument();
  });

  it("link Entrar aponta para /login", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /entrar/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("link Criar conta aponta para /signup", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /criar conta/i })).toHaveAttribute(
      "href",
      "/signup"
    );
  });
});
```

```ts
// tests/unit/marketing/HowItWorksSection.test.tsx
import { render, screen } from "@testing-library/react";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";

describe("HowItWorksSection", () => {
  it("renderiza 3 etapas numeradas", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("seção tem id como-funciona para âncora do Hero", () => {
    const { container } = render(<HowItWorksSection />);
    const section = container.querySelector("#como-funciona");
    expect(section).toBeInTheDocument();
  });
});
```

---

### Unit — lógica de redirect em `app/page.tsx`

```ts
// tests/unit/rootPage.test.ts
// Testar apenas a lógica de redirect — não o render completo (que é Server Component)

import { validateSession } from "@/lib/auth/session";

jest.mock("@/lib/auth/session");
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

const { redirect } = require("next/navigation");

describe("RootPage redirect logic", () => {
  it("redireciona para /dashboard quando sessão é válida", async () => {
    (validateSession as jest.Mock).mockResolvedValue({ user: { id: 1 }, session: {} });
    await import("@/app/page"); // importar e executar o Server Component
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("não redireciona quando sessão é inválida (renderiza landing)", async () => {
    (validateSession as jest.Mock).mockRejectedValue(new Error("Unauthorized"));
    // sem redirect → landing page é renderizada
    expect(redirect).not.toHaveBeenCalled();
  });
});
```

---

### Teste E2E sugerido (Playwright)

```ts
// tests/e2e/landing.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("visitante vê landing page em /", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("CTA primário leva para /signup", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /começar grátis/i }).click();
    await expect(page).toHaveURL("/signup");
  });

  test("botão Entrar leva para /login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /entrar/i }).first().click();
    await expect(page).toHaveURL("/login");
  });

  test("botão Ver demonstração rola para #como-funciona", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /ver demonstração/i }).click();
    const section = page.locator("#como-funciona");
    await expect(section).toBeInViewport();
  });

  test("usuário autenticado em / é redirecionado para /dashboard", async ({
    page,
    context,
  }) => {
    // Simular sessão autenticada via cookie/estado
    // (implementação depende do helper de auth do projeto de testes E2E)
    await loginAs(context, "admin@planilha.dev", "123456");
    await page.goto("/");
    await expect(page).toHaveURL("/dashboard");
  });

  test("landing page não faz chamadas de API", async ({ page }) => {
    const apiRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/")) apiRequests.push(req.url());
    });
    await page.goto("/");
    expect(apiRequests).toHaveLength(0);
  });
});
```

---

## Cobertura esperada

| Área | Tipo | Prioridade |
|------|------|-----------|
| Redirect de autenticado | Unit + E2E | Alta |
| Navbar — links corretos | Unit | Alta |
| Hero — CTAs funcionais | Unit + E2E | Alta |
| Features — 6 cards presentes | Unit | Média |
| How It Works — âncora e etapas | Unit + E2E | Média |
| CTA — link para /signup | Unit | Média |
| Zero requests de API | E2E | Alta |
| Responsividade mobile | Manual | Média |
