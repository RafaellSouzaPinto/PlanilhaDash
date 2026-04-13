// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock dos módulos que dependem de Node/browser APIs específicas
vi.mock("@/lib/parser", () => ({
  parseFile: vi.fn().mockResolvedValue([
    { mes: "Jan", receita: 1000, produto: "A" },
    { mes: "Fev", receita: 1500, produto: "B" },
    { mes: "Mar", receita: 1200, produto: "A" },
  ]),
}));

vi.mock("@/lib/inferTypes", () => ({
  inferTypes: vi.fn().mockReturnValue([
    { name: "mes", type: "categorical" },
    { name: "receita", type: "number" },
    { name: "produto", type: "categorical" },
  ]),
}));

vi.mock("@/lib/chartEngine", () => ({
  buildChartConfigs: vi.fn().mockReturnValue([
    { type: "bar", xKey: "mes", yKey: "receita", title: "Receita por Mês" },
    { type: "pie", xKey: "produto", yKey: "receita", title: "Receita por Produto" },
  ]),
}));

// Mock do ChartGrid — evita dependência de Recharts no jsdom
vi.mock("@/components/dashboard/ChartGrid", () => ({
  ChartGrid: ({ configs }: { configs: unknown[] }) => (
    <div data-testid="chart-grid">{configs.length} gráficos</div>
  ),
}));

// Mock do Dropzone — simula o componente sem react-dropzone
vi.mock("@/components/upload/Dropzone", () => ({
  Dropzone: ({ onFileAccepted }: { onFileAccepted: (f: File) => void }) => (
    <div
      data-testid="dropzone"
      onClick={() =>
        onFileAccepted(new File(["col1,col2\n1,2"], "test.csv", { type: "text/csv" }))
      }
    >
      Dropzone mock
    </div>
  ),
}));

import { LandingUpload } from "@/components/marketing/LandingUpload";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  localStorage.clear();
});

describe("LandingUpload — V3", () => {
  // ── Estado idle ────────────────────────────────────────────────────────────
  describe("estado idle (primeira visita)", () => {
    it("renderiza dropzone na primeira visita", () => {
      render(<LandingUpload />);
      expect(screen.getByTestId("landing-idle")).toBeInTheDocument();
      expect(screen.getByTestId("dropzone")).toBeInTheDocument();
    });

    it("NÃO exibe estado gated na primeira visita", () => {
      render(<LandingUpload />);
      expect(screen.queryByTestId("landing-gated")).toBeNull();
    });

    it("NÃO exibe resultado antes de upload", () => {
      render(<LandingUpload />);
      expect(screen.queryByTestId("landing-result")).toBeNull();
    });
  });

  // ── Estado parsing ─────────────────────────────────────────────────────────
  describe("estado parsing (processando arquivo)", () => {
    it("exibe spinner e nome do arquivo durante processamento", async () => {
      // parseFile fica pendente durante este teste
      const { parseFile } = await import("@/lib/parser");
      let resolveParseFile!: (v: unknown) => void;
      (parseFile as ReturnType<typeof vi.fn>).mockImplementationOnce(
        () => new Promise((r) => { resolveParseFile = r; })
      );

      render(<LandingUpload />);
      fireEvent.click(screen.getByTestId("dropzone"));

      await waitFor(() => {
        expect(screen.getByTestId("landing-parsing")).toBeInTheDocument();
      });
      expect(screen.getByText("Processando...")).toBeInTheDocument();
      expect(screen.getByText("test.csv")).toBeInTheDocument();

      resolveParseFile([]);
    });
  });

  // ── Estado result ──────────────────────────────────────────────────────────
  describe("estado result (dashboard gerado)", () => {
    it("exibe resultado após upload bem-sucedido", async () => {
      render(<LandingUpload />);
      fireEvent.click(screen.getByTestId("dropzone"));

      await waitFor(() => {
        expect(screen.getByTestId("landing-result")).toBeInTheDocument();
      });
    });

    it("exibe banner de conversão com texto correto", async () => {
      render(<LandingUpload />);
      fireEvent.click(screen.getByTestId("dropzone"));

      await waitFor(() => {
        expect(screen.getByText("Seu dashboard está pronto.")).toBeInTheDocument();
      });
      expect(screen.getByText(/Salvar, usar IA e exportar PDF exigem conta/i)).toBeInTheDocument();
    });

    it("banner tem link para /signup", async () => {
      render(<LandingUpload />);
      fireEvent.click(screen.getByTestId("dropzone"));

      await waitFor(() => {
        const links = screen.getAllByRole("link", { name: /criar conta grátis/i });
        expect(links[0]).toHaveAttribute("href", "/signup");
      });
    });

    it("exibe ChartGrid com os gráficos gerados (RN: máx 4)", async () => {
      render(<LandingUpload />);
      fireEvent.click(screen.getByTestId("dropzone"));

      await waitFor(() => {
        expect(screen.getByTestId("chart-grid")).toBeInTheDocument();
      });
    });

    it("marca pd_trial_used no localStorage após primeiro upload (RN: freemium)", async () => {
      render(<LandingUpload />);
      fireEvent.click(screen.getByTestId("dropzone"));

      await waitFor(() => {
        expect(screen.getByTestId("landing-result")).toBeInTheDocument();
      });
      expect(localStorage.getItem("pd_trial_used")).toBe("1");
    });

    it("exibe botão 'Processar outra planilha' para resetar", async () => {
      render(<LandingUpload />);
      fireEvent.click(screen.getByTestId("dropzone"));

      await waitFor(() => {
        expect(screen.getByTestId("landing-reset")).toBeInTheDocument();
      });
    });

    it("clicar em reset com trial_used=true vai para estado gated", async () => {
      render(<LandingUpload />);
      fireEvent.click(screen.getByTestId("dropzone"));

      await waitFor(() => {
        expect(screen.getByTestId("landing-reset")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("landing-reset"));

      await waitFor(() => {
        expect(screen.getByTestId("landing-gated")).toBeInTheDocument();
      });
    });
  });

  // ── Estado gated ───────────────────────────────────────────────────────────
  describe("estado gated (segunda visita)", () => {
    it("exibe gate quando localStorage tem pd_trial_used", async () => {
      localStorage.setItem("pd_trial_used", "1");
      render(<LandingUpload />);

      await waitFor(() => {
        expect(screen.getByTestId("landing-gated")).toBeInTheDocument();
      });
    });

    it("NÃO exibe dropzone no estado gated", async () => {
      localStorage.setItem("pd_trial_used", "1");
      render(<LandingUpload />);

      await waitFor(() => {
        expect(screen.queryByTestId("dropzone")).toBeNull();
      });
    });

    it("gate tem link para /signup", async () => {
      localStorage.setItem("pd_trial_used", "1");
      render(<LandingUpload />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: /criar conta grátis/i })
        ).toHaveAttribute("href", "/signup");
      });
    });

    it("gate tem link para /login", async () => {
      localStorage.setItem("pd_trial_used", "1");
      render(<LandingUpload />);

      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: /^entrar$/i })
        ).toHaveAttribute("href", "/login");
      });
    });

    it("gate exibe mensagem persuasiva", async () => {
      localStorage.setItem("pd_trial_used", "1");
      render(<LandingUpload />);

      await waitFor(() => {
        expect(
          screen.getByText(/Gostou\? Crie uma conta para continuar usando\./i)
        ).toBeInTheDocument();
      });
    });
  });

  // ── Regras de negócio ──────────────────────────────────────────────────────
  describe("regras de negócio", () => {
    it("NÃO faz chamadas a /api/* (RN8: landing é 100% client-side)", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      render(<LandingUpload />);
      fireEvent.click(screen.getByTestId("dropzone"));

      await waitFor(() => {
        expect(screen.getByTestId("landing-result")).toBeInTheDocument();
      });

      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it("não exibe campos de API Key (RN1: landing não coleta chaves)", async () => {
      render(<LandingUpload />);
      expect(document.querySelector("input[type='password']")).toBeNull();
    });
  });
});
