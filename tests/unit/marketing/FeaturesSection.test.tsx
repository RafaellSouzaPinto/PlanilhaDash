// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";

afterEach(cleanup);

describe("FeaturesSection — V2", () => {
  // ── Estrutura ──────────────────────────────────────────────────────────────
  it("renderiza com data-testid correto", () => {
    render(<FeaturesSection />);
    expect(screen.getByTestId("features-section")).toBeInTheDocument();
  });

  it("NÃO renderiza grid de ícones em caixinhas (V2: layout editorial)", () => {
    render(<FeaturesSection />);
    // V2 não usa o padrão bg-primary/10 com ícone em box
    const iconBoxes = document.querySelectorAll(".bg-primary\\/10");
    expect(iconBoxes.length).toBe(0);
  });

  // ── 3 features principais com h2 ──────────────────────────────────────────
  it("renderiza 3 headings h2 (uma por feature principal)", () => {
    render(<FeaturesSection />);
    const h2s = screen.getAllByRole("heading", { level: 2 });
    expect(h2s.length).toBe(3);
  });

  it("feature Upload tem h2 correto", () => {
    render(<FeaturesSection />);
    expect(
      screen.getByRole("heading", { level: 2, name: /jogue o arquivo/i })
    ).toBeInTheDocument();
  });

  it("feature IA tem h2 correto", () => {
    render(<FeaturesSection />);
    expect(
      screen.getByRole("heading", { level: 2, name: /sua chave\. seu modelo/i })
    ).toBeInTheDocument();
  });

  it("feature Histórico tem h2 correto", () => {
    render(<FeaturesSection />);
    expect(
      screen.getByRole("heading", { level: 2, name: /todo relatório salvo/i })
    ).toBeInTheDocument();
  });

  // ── Labels de seção (chapéu tipográfico) ───────────────────────────────────
  it("label 'Upload' presente acima da feature", () => {
    render(<FeaturesSection />);
    expect(screen.getByText("Upload")).toBeInTheDocument();
  });

  it("label 'Análise com IA' presente acima da feature", () => {
    render(<FeaturesSection />);
    expect(screen.getByText("Análise com IA")).toBeInTheDocument();
  });

  it("label 'Histórico' presente acima da feature", () => {
    render(<FeaturesSection />);
    expect(screen.getByText("Histórico")).toBeInTheDocument();
  });

  // ── Mockups contextuais ────────────────────────────────────────────────────
  it("mockup de upload está presente", () => {
    render(<FeaturesSection />);
    expect(screen.getByTestId("upload-mockup")).toBeInTheDocument();
  });

  it("mockup de IA está presente", () => {
    render(<FeaturesSection />);
    expect(screen.getByTestId("ai-mockup")).toBeInTheDocument();
  });

  it("mockup de histórico está presente", () => {
    render(<FeaturesSection />);
    expect(screen.getByTestId("history-mockup")).toBeInTheDocument();
  });

  it("mockup de upload exibe formatos suportados (RN: CSV, XLSX, ODS)", () => {
    render(<FeaturesSection />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/CSV/);
    expect(text).toMatch(/XLSX/);
    expect(text).toMatch(/ODS/);
  });

  it("mockup de IA mostra seleção de provider (RN: multi-provider)", () => {
    render(<FeaturesSection />);
    const aiMockup = screen.getByTestId("ai-mockup");
    expect(aiMockup).toHaveTextContent("OpenAI");
    expect(aiMockup).toHaveTextContent("Claude");
    expect(aiMockup).toHaveTextContent("Gemini");
    expect(aiMockup).toHaveTextContent("Groq");
  });

  it("mockup de IA mostra campo de API Key mascarado (RN: chave nunca exposta)", () => {
    render(<FeaturesSection />);
    const aiMockup = screen.getByTestId("ai-mockup");
    // A key deve aparecer mascarada com ••• — nunca em plaintext
    expect(aiMockup.textContent).toMatch(/sk-ant-[•·]+/);
  });

  it("mockup de IA mostra botão 'Analisar'", () => {
    render(<FeaturesSection />);
    expect(screen.getByText(/analisar planilha/i)).toBeInTheDocument();
  });

  it("mockup de IA NÃO mostra análise com números falsos", () => {
    render(<FeaturesSection />);
    const aiMockup = screen.getByTestId("ai-mockup");
    // Não deve ter "receita cresceu" ou percentuais específicos inventados
    expect(aiMockup.textContent?.toLowerCase()).not.toContain("receita cresceu");
    expect(aiMockup.textContent).not.toMatch(/\b34%\b|\b61%\b/);
  });

  it("mockup de IA menciona que API Key não é armazenada em texto puro (RN1)", () => {
    render(<FeaturesSection />);
    expect(
      screen.getByText(/sem armazenar sua chave em texto puro/i)
    ).toBeInTheDocument();
  });

  // ── Features secundárias ───────────────────────────────────────────────────
  it("seção 'Também inclui' está presente", () => {
    render(<FeaturesSection />);
    expect(screen.getByText(/também inclui/i)).toBeInTheDocument();
  });

  it("feature secundária 'Criptografia AES-256-GCM' presente (RN: criptografia)", () => {
    render(<FeaturesSection />);
    expect(screen.getByText(/AES-256-GCM/i)).toBeInTheDocument();
  });

  it("feature secundária 'Até 4 gráficos por dashboard' presente (RN: limite 4)", () => {
    render(<FeaturesSection />);
    expect(screen.getByText(/Até 4 gráficos por dashboard/i)).toBeInTheDocument();
  });

  it("feature secundária 'Exportação PDF' presente", () => {
    render(<FeaturesSection />);
    expect(screen.getByText(/Exportação PDF/i)).toBeInTheDocument();
  });
});
