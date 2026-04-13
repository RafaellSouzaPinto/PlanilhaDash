// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HeroSection } from "@/components/marketing/HeroSection";

afterEach(cleanup);

describe("HeroSection — V2", () => {
  // ── Estrutura ──────────────────────────────────────────────────────────────
  it("renderiza com data-testid correto", () => {
    render(<HeroSection />);
    expect(screen.getByTestId("hero-section")).toBeInTheDocument();
  });

  it("renderiza heading h1", () => {
    render(<HeroSection />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("h1 menciona 'planilha'", () => {
    render(<HeroSection />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent?.toLowerCase()).toContain("planilha");
  });

  it("h1 menciona 'dashboard'", () => {
    render(<HeroSection />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent?.toLowerCase()).toContain("dashboard");
  });

  it("subtitle menciona 'configurar' (V2: sem café)", () => {
    render(<HeroSection />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent?.toLowerCase()).toContain("configurar");
  });

  it("NÃO usa 'café' no subtitle (copy atualizado)", () => {
    render(<HeroSection />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent?.toLowerCase()).not.toContain("café");
  });

  // ── Pill badge (V2: sem ✓ e sem emoji) ────────────────────────────────────
  it("pill badge exibe 'Open source'", () => {
    render(<HeroSection />);
    expect(screen.getByText("Open source")).toBeInTheDocument();
  });

  it("pill badge exibe 'Gratuito'", () => {
    render(<HeroSection />);
    expect(screen.getByText("Gratuito")).toBeInTheDocument();
  });

  it("pill badge exibe 'Bring Your Own Key'", () => {
    render(<HeroSection />);
    expect(screen.getByText("Bring Your Own Key")).toBeInTheDocument();
  });

  it("NÃO usa emoji no pill badge (V2: sem ✓)", () => {
    render(<HeroSection />);
    const text = document.body.textContent ?? "";
    expect(text).not.toContain("✓");
  });

  // ── CTAs ───────────────────────────────────────────────────────────────────
  it("CTA primário 'Criar conta grátis' aponta para /signup", () => {
    render(<HeroSection />);
    const link = screen.getByRole("link", { name: /criar conta grátis/i });
    expect(link).toHaveAttribute("href", "/signup");
  });

  it("CTA primário NÃO contém emoji (V2: sem 🚀)", () => {
    render(<HeroSection />);
    const link = screen.getByRole("link", { name: /criar conta grátis/i });
    expect(link.textContent).not.toMatch(/[\u{1F000}-\u{1FFFF}]/u);
  });

  it("CTA secundário aponta para âncora #como-funciona", () => {
    render(<HeroSection />);
    const link = screen.getByRole("link", { name: /ver como funciona/i });
    expect(link).toHaveAttribute("href", "#como-funciona");
  });

  // ── Mockup do produto ──────────────────────────────────────────────────────
  it("mockup do produto está presente com role='img'", () => {
    render(<HeroSection />);
    expect(screen.getByRole("img", { name: /prévia do dashboard/i })).toBeInTheDocument();
  });

  it("mockup exibe nome de arquivo verossímil", () => {
    render(<HeroSection />);
    expect(screen.getByText(/vendas-q4-2024\.xlsx/i)).toBeInTheDocument();
  });

  it("mockup exibe contagem de linhas detectadas", () => {
    render(<HeroSection />);
    expect(screen.getByText(/1\.240 linhas/i)).toBeInTheDocument();
  });

  it("mockup exibe 4 cards de gráfico (RN: máx 4 gráficos por dashboard)", () => {
    render(<HeroSection />);
    // Cada label de gráfico é único — contar pelos textos dos gráficos
    expect(screen.getByText("Receita por mês")).toBeInTheDocument();
    expect(screen.getByText("Top produtos")).toBeInTheDocument();
    expect(screen.getByText("Clientes por região")).toBeInTheDocument();
    expect(screen.getByText("Ticket médio")).toBeInTheDocument();
  });

  it("mockup NÃO exibe mais de 4 gráficos (RN: limite de 4)", () => {
    render(<HeroSection />);
    const mockup = screen.getByTestId("hero-mockup");
    // Contar cards de gráfico pelo grid interno
    const grid = mockup.querySelector(".grid");
    expect(grid?.children.length).toBeLessThanOrEqual(4);
  });

  it("mockup exibe badge '4 gráficos' (RN: limite de 4)", () => {
    render(<HeroSection />);
    expect(screen.getByText("4 gráficos")).toBeInTheDocument();
  });

  // ── Regras de negócio ──────────────────────────────────────────────────────
  it("página não faz chamadas de API (RN: landing é estática — sem fetch)", () => {
    // Verificação estrutural: nenhum elemento com data de servidor
    render(<HeroSection />);
    const html = document.body.innerHTML;
    expect(html).not.toMatch(/api\/reports|api\/auth/i);
  });
});
