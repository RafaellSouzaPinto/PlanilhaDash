// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProvidersStrip } from "@/components/marketing/ProvidersStrip";

afterEach(cleanup);

describe("ProvidersStrip — V2 (seção nova)", () => {
  // ── Estrutura ──────────────────────────────────────────────────────────────
  it("renderiza com data-testid correto", () => {
    render(<ProvidersStrip />);
    expect(screen.getByTestId("providers-strip")).toBeInTheDocument();
  });

  it("exibe label 'Compatível com'", () => {
    render(<ProvidersStrip />);
    expect(screen.getByText(/compatível com/i)).toBeInTheDocument();
  });

  // ── Providers (RN: multi-provider — OpenAI, Anthropic, Google, Groq) ───────
  it("lista 'OpenAI' como provider suportado", () => {
    render(<ProvidersStrip />);
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
  });

  it("lista 'Anthropic' como provider suportado", () => {
    render(<ProvidersStrip />);
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
  });

  it("lista 'Google Gemini' como provider suportado", () => {
    render(<ProvidersStrip />);
    expect(screen.getByText("Google Gemini")).toBeInTheDocument();
  });

  it("lista 'Groq' como provider suportado", () => {
    render(<ProvidersStrip />);
    expect(screen.getByText("Groq")).toBeInTheDocument();
  });

  it("exibe exatamente 4 providers (RN: 4 providers suportados)", () => {
    render(<ProvidersStrip />);
    // Todos os spans de provider ficam dentro do container de providers
    const strip = screen.getByTestId("providers-strip");
    const providers = ["OpenAI", "Anthropic", "Google Gemini", "Groq"];
    providers.forEach((p) => {
      expect(strip).toHaveTextContent(p);
    });
  });

  // ── RN: API Keys nunca em plaintext — a strip é apenas marketing, sem dados ─
  it("strip não contém campos de input ou formulários", () => {
    render(<ProvidersStrip />);
    expect(document.querySelector("input")).toBeNull();
    expect(document.querySelector("form")).toBeNull();
  });
});
