// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

afterEach(() => {
  cleanup();
});
import { ChartSuggestionSelector } from "@/components/ai/ChartSuggestionSelector";
import { mockAISuggestions } from "../fixtures/m08";
import type { ChartSuggestion } from "@/types/spreadsheet";

// 5 suggestions to test the max-4 limit
const fiveSuggestions: ChartSuggestion[] = [
  ...mockAISuggestions,
  {
    type: "barHorizontal",
    xKey: "margem",
    yKey: "região",
    title: "Margem por Região",
    rationale: "Sugestão extra 1.",
    priority: 4,
  },
  {
    type: "table",
    xKey: "data",
    title: "Dados Completos",
    rationale: "Sugestão extra 2.",
    priority: 5,
  },
];

describe("ChartSuggestionSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("T-C01: renderiza todas as sugestões com título e rationale", () => {
    render(
      <ChartSuggestionSelector
        suggestions={mockAISuggestions}
        loading={false}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Total de Vendas por Região")).toBeInTheDocument();
    expect(screen.getByText("Evolução de Vendas ao Longo do Tempo")).toBeInTheDocument();
    expect(screen.getByText("Distribuição por Região")).toBeInTheDocument();

    // Rationale texts
    expect(
      screen.getByText(/6 regiões com alta variação/)
    ).toBeInTheDocument();
  });

  it("T-C02: estado de loading exibe skeletons, não os cards de sugestão", () => {
    render(
      <ChartSuggestionSelector
        suggestions={[]}
        loading={true}
        onConfirm={vi.fn()}
      />
    );

    const skeletons = screen.getAllByTestId("suggestion-skeleton");
    expect(skeletons).toHaveLength(4);

    // No suggestion titles visible
    expect(screen.queryByText("Total de Vendas por Região")).not.toBeInTheDocument();
  });

  it("T-C03: selecionar um item atualiza o contador", () => {
    render(
      <ChartSuggestionSelector
        suggestions={mockAISuggestions}
        loading={false}
        onConfirm={vi.fn()}
      />
    );

    // Initially 0 selected
    expect(screen.getByText("0 de 4 selecionados")).toBeInTheDocument();

    // Click the first card
    fireEvent.click(screen.getByTestId("suggestion-card-0"));

    expect(screen.getByText("1 de 4 selecionados")).toBeInTheDocument();
  });

  it("T-C04: máximo de 4 seleções — 5º checkbox fica disabled", () => {
    render(
      <ChartSuggestionSelector
        suggestions={fiveSuggestions}
        loading={false}
        onConfirm={vi.fn()}
      />
    );

    // Select first 4
    fireEvent.click(screen.getByTestId("suggestion-card-0"));
    fireEvent.click(screen.getByTestId("suggestion-card-1"));
    fireEvent.click(screen.getByTestId("suggestion-card-2"));
    fireEvent.click(screen.getByTestId("suggestion-card-3"));

    expect(screen.getByText("4 de 4 selecionados")).toBeInTheDocument();

    // 5th checkbox is disabled
    const fifthCheckbox = screen.getByTestId("checkbox-4");
    expect(fifthCheckbox).toBeDisabled();

    // Confirm button is enabled
    const confirmBtn = screen.getByRole("button", {
      name: /Gerar dashboard com seleção/i,
    });
    expect(confirmBtn).not.toBeDisabled();
  });

  it("T-C05: desmarcar uma seleção reabilita checkboxes desabilitados", () => {
    render(
      <ChartSuggestionSelector
        suggestions={fiveSuggestions}
        loading={false}
        onConfirm={vi.fn()}
      />
    );

    // Select 4
    fireEvent.click(screen.getByTestId("suggestion-card-0"));
    fireEvent.click(screen.getByTestId("suggestion-card-1"));
    fireEvent.click(screen.getByTestId("suggestion-card-2"));
    fireEvent.click(screen.getByTestId("suggestion-card-3"));

    // 5th is disabled
    expect(screen.getByTestId("checkbox-4")).toBeDisabled();

    // Deselect the first card
    fireEvent.click(screen.getByTestId("suggestion-card-0"));

    expect(screen.getByText("3 de 4 selecionados")).toBeInTheDocument();
    // 5th should be enabled again
    expect(screen.getByTestId("checkbox-4")).not.toBeDisabled();
  });

  it("T-C06: botão Confirmar chama onConfirm com os itens selecionados", () => {
    const onConfirm = vi.fn();

    render(
      <ChartSuggestionSelector
        suggestions={mockAISuggestions}
        loading={false}
        onConfirm={onConfirm}
      />
    );

    // Select first two cards
    fireEvent.click(screen.getByTestId("suggestion-card-0"));
    fireEvent.click(screen.getByTestId("suggestion-card-1"));

    const confirmBtn = screen.getByRole("button", {
      name: /Gerar dashboard com seleção/i,
    });
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const [calledWith] = onConfirm.mock.calls[0] as [ChartSuggestion[]];
    expect(calledWith).toHaveLength(2);
    expect(calledWith.some((s) => s.type === "bar")).toBe(true);
    expect(calledWith.some((s) => s.type === "line")).toBe(true);
  });

  it("T-C07: botão Confirmar fica disabled quando 0 itens selecionados", () => {
    const onConfirm = vi.fn();

    render(
      <ChartSuggestionSelector
        suggestions={mockAISuggestions}
        loading={false}
        onConfirm={onConfirm}
      />
    );

    const confirmBtn = screen.getByRole("button", {
      name: /Gerar dashboard com seleção/i,
    });

    expect(confirmBtn).toBeDisabled();

    fireEvent.click(confirmBtn);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
