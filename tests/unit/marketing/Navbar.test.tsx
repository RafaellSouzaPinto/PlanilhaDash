// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Navbar } from "@/components/marketing/Navbar";

afterEach(cleanup);

describe("Navbar — V3 (ultra-minimal)", () => {
  it("renderiza elemento <header>", () => {
    render(<Navbar />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renderiza com data-testid correto", () => {
    render(<Navbar />);
    expect(screen.getByTestId("marketing-navbar")).toBeInTheDocument();
  });

  it("exibe logo 'Planilha' + 'Dash'", () => {
    render(<Navbar />);
    expect(screen.getByText("Planilha")).toBeInTheDocument();
    expect(screen.getByText("Dash")).toBeInTheDocument();
  });

  it("link da logo aponta para /", () => {
    render(<Navbar />);
    expect(
      screen.getByRole("link", { name: /PlanilhaDash — página inicial/i })
    ).toHaveAttribute("href", "/");
  });

  it("link Entrar aponta para /login", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /^entrar$/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  // ── V3: sem "Criar conta" na navbar (o dropzone é a conversão) ─────────────
  it("NÃO tem link 'Criar conta' na navbar (V3: sem CTA duplicado)", () => {
    render(<Navbar />);
    expect(screen.queryByRole("link", { name: /criar conta/i })).toBeNull();
  });

  // ── V3: sem GitHub na navbar (distrai da conversão) ────────────────────────
  it("NÃO tem link GitHub na navbar (V3: foco no dropzone)", () => {
    render(<Navbar />);
    expect(screen.queryByRole("link", { name: /github/i })).toBeNull();
  });

  it("NÃO renderiza ícone SVG como logo (V3: logo tipográfico)", () => {
    render(<Navbar />);
    const logoLink = screen.getByRole("link", { name: /PlanilhaDash — página inicial/i });
    expect(logoLink.querySelector("svg")).toBeNull();
  });

  it("navbar não expõe dados sensíveis (RN: sem API key, token, session)", () => {
    render(<Navbar />);
    const html = document.body.innerHTML;
    expect(html).not.toMatch(/api.?key/i);
    expect(html).not.toMatch(/session/i);
    expect(html).not.toMatch(/token/i);
  });
});
