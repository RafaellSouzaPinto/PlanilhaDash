// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FooterSection } from "@/components/marketing/FooterSection";

afterEach(cleanup);

describe("FooterSection — V2", () => {
  // ── Estrutura ──────────────────────────────────────────────────────────────
  it("renderiza elemento <footer>", () => {
    render(<FooterSection />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renderiza com data-testid correto", () => {
    render(<FooterSection />);
    expect(screen.getByTestId("footer-section")).toBeInTheDocument();
  });

  // ── Logo tipográfico (V2: sem ícone) ───────────────────────────────────────
  it("exibe 'Planilha' na logo do footer", () => {
    render(<FooterSection />);
    expect(screen.getByText("Planilha")).toBeInTheDocument();
  });

  it("exibe 'Dash' na logo do footer", () => {
    render(<FooterSection />);
    expect(screen.getByText("Dash")).toBeInTheDocument();
  });

  it("link da logo aponta para /", () => {
    render(<FooterSection />);
    const logoLinks = screen.getAllByRole("link").filter(
      (l) => l.getAttribute("href") === "/"
    );
    expect(logoLinks.length).toBeGreaterThanOrEqual(1);
  });

  // ── Grupos de navegação (V2: dois grupos) ──────────────────────────────────
  it("grupo 'Produto' está presente", () => {
    render(<FooterSection />);
    expect(screen.getByText("Produto")).toBeInTheDocument();
  });

  it("grupo 'Projeto' está presente", () => {
    render(<FooterSection />);
    expect(screen.getByText("Projeto")).toBeInTheDocument();
  });

  it("link Entrar no grupo Produto aponta para /login", () => {
    render(<FooterSection />);
    const entrar = screen.getByRole("link", { name: /^entrar$/i });
    expect(entrar).toHaveAttribute("href", "/login");
  });

  it("link Criar conta no grupo Produto aponta para /signup", () => {
    render(<FooterSection />);
    const criar = screen.getByRole("link", { name: /^criar conta$/i });
    expect(criar).toHaveAttribute("href", "/signup");
  });

  it("link GitHub no grupo Projeto tem target _blank", () => {
    render(<FooterSection />);
    const github = screen.getByRole("link", { name: /^github$/i });
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("link 'Reportar bug' no grupo Projeto está presente e abre externamente", () => {
    render(<FooterSection />);
    const bug = screen.getByRole("link", { name: /reportar bug/i });
    expect(bug).toHaveAttribute("target", "_blank");
    expect(bug).toHaveAttribute("rel", "noopener noreferrer");
  });

  // ── Linha inferior ─────────────────────────────────────────────────────────
  it("exibe copyright © 2025", () => {
    render(<FooterSection />);
    expect(screen.getByText(/© 2025/)).toBeInTheDocument();
  });

  it("menciona licença MIT", () => {
    render(<FooterSection />);
    // MIT aparece em dois lugares — verificar que pelo menos um existe
    expect(screen.getAllByText(/MIT/i).length).toBeGreaterThanOrEqual(1);
  });

  it("menciona 'Next.js' nos créditos de tecnologia", () => {
    render(<FooterSection />);
    expect(screen.getByText(/next\.js/i)).toBeInTheDocument();
  });

  it("menciona 'shadcn/ui' nos créditos de tecnologia", () => {
    render(<FooterSection />);
    expect(screen.getByText(/shadcn\/ui/i)).toBeInTheDocument();
  });
});
