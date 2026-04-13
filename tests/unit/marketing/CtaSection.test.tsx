// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CtaSection } from "@/components/marketing/CtaSection";

afterEach(cleanup);

describe("CtaSection — V2", () => {
  // ── Estrutura ──────────────────────────────────────────────────────────────
  it("renderiza com data-testid correto", () => {
    render(<CtaSection />);
    expect(screen.getByTestId("cta-section")).toBeInTheDocument();
  });

  it("renderiza heading h2", () => {
    render(<CtaSection />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  // ── Copy V2 (tipográfico, sem bloco colorido) ─────────────────────────────
  it("h2 menciona 'planilha' (copy específico V2)", () => {
    render(<CtaSection />);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2.textContent?.toLowerCase()).toContain("planilha");
  });

  it("NÃO usa bloco bg-primary como container do CTA (V2: tipográfico)", () => {
    render(<CtaSection />);
    // V1 tinha rounded-2xl bg-primary — V2 não tem esse padrão
    const block = document.querySelector(".rounded-2xl.bg-primary");
    expect(block).toBeNull();
  });

  it("texto menciona 'grátis' ou 'cartão' (sem barreira de entrada)", () => {
    render(<CtaSection />);
    const text = document.body.textContent ?? "";
    expect(text.toLowerCase()).toMatch(/grátis|cartão/);
  });

  it("menciona GitHub (relevante para projeto open source)", () => {
    render(<CtaSection />);
    const github = screen.getByRole("link", { name: /github/i });
    expect(github).toBeInTheDocument();
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noopener noreferrer");
  });

  // ── CTA principal ─────────────────────────────────────────────────────────
  it("botão 'Criar conta grátis' aponta para /signup", () => {
    render(<CtaSection />);
    expect(
      screen.getByRole("link", { name: /criar conta grátis/i })
    ).toHaveAttribute("href", "/signup");
  });

  it("botão NÃO contém emoji (V2: sem emoji em CTAs)", () => {
    render(<CtaSection />);
    const btn = screen.getByRole("link", { name: /criar conta grátis/i });
    expect(btn.textContent).not.toMatch(/[\u{1F000}-\u{1FFFF}]/u);
  });
});
