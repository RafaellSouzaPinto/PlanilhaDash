# M07-V3 — Landing Page: Upload-First

**Antecede:** [M07_LANDING_PAGE_V2.md](M07_LANDING_PAGE_V2.md)
**Status:** 📋 Especificado

---

## Por que V3

A V2 ainda era uma landing page de marketing — seções de features, "como funciona", CTA block. Funciona para produto maduro com tração. Para um micro-SaaS em crescimento, o problema é a fricção: o usuário lê, avalia, talvez clique.

A V3 elimina a avaliação. O usuário chega, arrasta o arquivo, e já vê o resultado. O produto vende a si mesmo em tempo real.

**Referência da mudança:** decisão do produto — "A landing mano, tem que ser o canal. Menos fricção possível, menos informação, clean, e tem que ser muito bonita. Um botão chamativo no meio da página."

---

## Fluxo completo

```
1. Primeira visita
   └── Landing com dropzone grande
         └── Usuário arrasta arquivo
               └── Parse client-side (PapaParse/SheetJS)
                     └── ChartGrid exibido na própria página
                           └── Banner: "Salvar? Usar IA? Exportar PDF?"
                                 └── [Criar conta grátis] → /signup
                                       └── localStorage: pd_trial_used = '1'

2. Segunda visita (pd_trial_used = '1' no localStorage)
   └── Landing mostra gate no lugar do dropzone:
         "Gostou? Crie uma conta para continuar."
         [Criar conta grátis]   [Entrar]
```

---

## Arquivos

| Ação | Arquivo |
|------|---------|
| Alterar | `src/components/marketing/Navbar.tsx` |
| Criar | `src/components/marketing/LandingUpload.tsx` |
| Remover do `page.tsx` | `HeroSection`, `ProvidersStrip`, `FeaturesSection`, `HowItWorksSection`, `CtaSection`, `FooterSection` |
| Alterar | `src/app/page.tsx` |

---

## Layout da página

```
┌──────────────────────────────────────────────────────────┐
│  PlanilhaDash                                  Entrar     │  ← h-14, sem "Criar conta"
├──────────────────────────────────────────────────────────┤
│                                                          │
│                                                          │
│         Arraste sua planilha.                            │  ← h1, 2 linhas, grande
│         Veja o dashboard aparecer.                       │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │                                                  │   │
│   │               [↑]                               │   │
│   │          Solte o arquivo aqui                    │   │  ← Dropzone grande
│   │      CSV, XLSX ou ODS · máx 10MB                │   │
│   │                                                  │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│      Grátis, sem cadastro. Resultado em segundos.        │  ← 1 linha, muted
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Estados do componente `LandingUpload`

### Estado 1 — `idle`

Dropzone padrão, grande, com hover/drag states. Primeira visita não tem nenhum bloqueio.

### Estado 2 — `parsing`

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│     vendas-q4-2024.xlsx                              │
│     Processando...  ◌                                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Spinner inline + nome do arquivo. Sem bloquear a tela.

### Estado 3 — `result`

```
┌──────────────────────────────────────────────────────┐
│  Seu dashboard está pronto.                          │
│  Salvar, usar IA e exportar exigem conta — é grátis. │
│                                      [Criar conta →] │
└──────────────────────────────────────────────────────┘

[ChartGrid com os gráficos reais da planilha]

[Processar outra planilha ↺]  ← link pequeno, discreto
```

- Banner fixo no topo da área de resultado
- ChartGrid renderizado com os dados reais (Recharts)
- Link "Processar outra planilha" → reseta o estado local para `idle`
  - Se `pd_trial_used=true` já está no localStorage → reseta para `gated` ao invés de `idle`

### Estado 4 — `gated`

Aparece quando `localStorage['pd_trial_used'] = '1'` E o usuário não tem resultado na sessão atual.

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   Gostou? Crie uma conta para continuar usando.      │
│                                                      │
│        [Criar conta grátis]    [Entrar]              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Ocupa o mesmo espaço que o dropzone. Visual clean, sem drama.

---

## `src/components/marketing/LandingUpload.tsx`

```tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Loader2, RotateCcw } from "lucide-react";
import { Dropzone } from "@/components/upload/Dropzone";
import { ChartGrid } from "@/components/dashboard/ChartGrid";
import { Button } from "@/components/ui/button";
import { parseFile } from "@/lib/parser";
import { inferTypes } from "@/lib/inferTypes";
import { buildChartConfigs } from "@/lib/chartEngine";
import type { ChartConfig } from "@/types/spreadsheet";

const TRIAL_KEY = "pd_trial_used";

type State = "idle" | "parsing" | "result" | "gated";

export function LandingUpload() {
  const [state, setState] = useState<State>("idle");
  const [fileName, setFileName] = useState("");
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(TRIAL_KEY)) {
      setState("gated");
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setState("parsing");
    setError("");

    try {
      const rows = await parseFile(file);
      const cols = inferTypes(rows);
      const configs = buildChartConfigs(cols, rows);
      setCharts(configs);
      setState("result");
      localStorage.setItem(TRIAL_KEY, "1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar arquivo");
      setState("idle");
    }
  }, []);

  function handleReset() {
    const alreadyUsed = localStorage.getItem(TRIAL_KEY) === "1";
    setCharts([]);
    setError("");
    setState(alreadyUsed ? "gated" : "idle");
  }

  if (state === "gated") {
    return (
      <div className="w-full rounded-xl border-2 border-dashed border-border px-8 py-16 text-center space-y-6">
        <p className="text-lg font-medium text-foreground">
          Gostou? Crie uma conta para continuar usando.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/signup">Criar conta grátis</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (state === "parsing") {
    return (
      <div className="w-full rounded-xl border-2 border-dashed border-border px-8 py-16 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">{fileName}</p>
        <p className="text-sm text-muted-foreground">Processando...</p>
      </div>
    );
  }

  if (state === "result") {
    return (
      <div className="w-full space-y-6" data-testid="landing-result">
        {/* Banner de conversão */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border bg-muted/30 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Seu dashboard está pronto.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Salvar, usar IA e exportar PDF exigem conta — é grátis.
            </p>
          </div>
          <Button size="sm" asChild className="shrink-0">
            <Link href="/signup">Criar conta grátis</Link>
          </Button>
        </div>

        {/* Gráficos reais */}
        <ChartGrid configs={charts} />

        {/* Reset */}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <RotateCcw className="h-3 w-3" />
          Processar outra planilha
        </button>
      </div>
    );
  }

  // idle
  return (
    <div className="w-full space-y-2">
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
      <Dropzone onFileAccepted={handleFile} />
    </div>
  );
}
```

---

## `src/components/marketing/Navbar.tsx` — V3

Sem "Criar conta" — o dropzone é a conversão. Sem GitHub na nav — distrai. Só logo + "Entrar".

```tsx
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur" data-testid="marketing-navbar">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="text-sm font-medium" aria-label="PlanilhaDash — página inicial">
            <span className="font-normal text-muted-foreground">Planilha</span>
            <span className="font-bold text-foreground">Dash</span>
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}
```

---

## `src/app/page.tsx` — V3

```tsx
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/session";
import { Navbar } from "@/components/marketing/Navbar";
import { LandingUpload } from "@/components/marketing/LandingUpload";

export const metadata = {
  title: "PlanilhaDash — Dashboards a partir de planilhas",
  description: "Arraste uma planilha CSV, XLSX ou ODS e veja o dashboard aparecer em segundos.",
};

export default async function RootPage() {
  const session = await validateSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-3xl space-y-8">
          <h1 className="text-center text-4xl sm:text-5xl font-bold tracking-tighter text-foreground leading-tight">
            Arraste sua planilha.
            <br />
            <span className="font-normal text-muted-foreground">
              Veja o dashboard aparecer.
            </span>
          </h1>
          <LandingUpload />
          <p className="text-center text-xs text-muted-foreground">
            CSV, XLSX ou ODS · Grátis, sem cadastro · Resultado em segundos
          </p>
        </div>
      </main>
    </div>
  );
}
```

---

## O que removeu vs V2

| Componente V2 | Destino V3 |
|---------------|-----------|
| `HeroSection` | Substituído por `h1` inline no `page.tsx` |
| `FeaturesSection` | Removido da página |
| `HowItWorksSection` | Removido da página |
| `CtaSection` | Substituído pelo banner dentro de `LandingUpload` |
| `ProvidersStrip` | Removido da página |
| `FooterSection` | Removido da página |
| `Navbar` | Simplificado: sem "Criar conta", sem GitHub |

> Os arquivos dos componentes antigos permanecem em `src/components/marketing/` — podem ser reutilizados em futura página de marketing separada (`/sobre`, `/pricing`, etc.).

---

## Regras de negócio cruzadas

| RN | Como aparece na V3 |
|----|--------------------|
| RN3 (sem `any` TypeScript) | `LandingUpload` usa tipos explícitos `ChartConfig[]`, `State` |
| RN5 (não alterar schema) | Landing não toca banco — 100% client-side |
| RN8 (`user_id` sempre da sessão) | Landing não faz chamadas autenticadas |
| RN11 (máx 4 gráficos) | `buildChartConfigs` já limita — ChartGrid exibe o retorno direto |
| RN12 (amostra de 50 linhas para IA) | Landing não usa IA — gate redireciona para conta |

---

## Testes

Ver [../testes/T11_LANDING_PAGE.md](../testes/T11_LANDING_PAGE.md) — atualizar para V3.

Novos testes necessários:
- `LandingUpload`: todos os 4 estados (idle, parsing, result, gated)
- `Navbar` V3: sem "Criar conta" na nav
- `page.tsx`: heading correto, sem seções de marketing
