// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";

afterEach(cleanup);

describe("HowItWorksSection — V2", () => {
  // ── Estrutura ──────────────────────────────────────────────────────────────
  it("renderiza com data-testid correto", () => {
    render(<HowItWorksSection />);
    expect(screen.getByTestId("how-it-works-section")).toBeInTheDocument();
  });

  it("seção tem id='como-funciona' para âncora do Hero", () => {
    render(<HowItWorksSection />);
    expect(document.getElementById("como-funciona")).toBeInTheDocument();
  });

  it("renderiza heading h2 'Como o PlanilhaDash funciona'", () => {
    render(<HowItWorksSection />);
    expect(
      screen.getByRole("heading", { level: 2, name: /como o planilhadash funciona/i })
    ).toBeInTheDocument();
  });

  // ── Numeração V2: 01, 02, 03 (não 1, 2, 3) ────────────────────────────────
  it("usa numeração tipográfica '01' (V2: não '1')", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("usa numeração tipográfica '02'", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("02")).toBeInTheDocument();
  });

  it("usa numeração tipográfica '03'", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("NÃO usa círculos coloridos bg-primary para numeração (V2)", () => {
    render(<HowItWorksSection />);
    const circles = document.querySelectorAll(".rounded-full.bg-primary");
    expect(circles.length).toBe(0);
  });

  it("NÃO usa linha tracejada border-dashed entre etapas (V2)", () => {
    render(<HowItWorksSection />);
    const dashedLines = document.querySelectorAll(".border-dashed");
    expect(dashedLines.length).toBe(0);
  });

  // ── Títulos das etapas ─────────────────────────────────────────────────────
  it("etapa 01 tem h3 'Faça upload da planilha'", () => {
    render(<HowItWorksSection />);
    expect(screen.getByRole("heading", { level: 3, name: /faça upload da planilha/i })).toBeInTheDocument();
  });

  it("etapa 02 tem h3 'Os gráficos aparecem automaticamente'", () => {
    render(<HowItWorksSection />);
    expect(
      screen.getByRole("heading", { level: 3, name: /os gráficos aparecem automaticamente/i })
    ).toBeInTheDocument();
  });

  it("etapa 03 tem h3 'Peça uma análise à IA'", () => {
    render(<HowItWorksSection />);
    expect(
      screen.getByRole("heading", { level: 3, name: /peça uma análise/i })
    ).toBeInTheDocument();
  });

  // ── Regras de negócio cruzadas ─────────────────────────────────────────────
  it("menciona formatos suportados na etapa 01 (RN: CSV, XLSX, ODS)", () => {
    render(<HowItWorksSection />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/CSV/);
    expect(text).toMatch(/XLSX/);
    expect(text).toMatch(/ODS/);
  });

  it("menciona limite de gráficos na etapa 02 (RN: até 4 gráficos)", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText(/até 4 gráficos/i)).toBeInTheDocument();
  });

  it("menciona providers de IA na etapa 03 (RN: multi-provider)", () => {
    render(<HowItWorksSection />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/OpenAI/);
    expect(text).toMatch(/Claude/);
    expect(text).toMatch(/Gemini/);
    expect(text).toMatch(/Groq/);
  });

  it("menciona 'amostra' na etapa 03 (RN: AI_SAMPLE_ROWS — nunca planilha completa)", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText(/amostra/i)).toBeInTheDocument();
  });
});
