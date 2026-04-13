import Link from "next/link";
import { Button } from "@/components/ui/button";

// Dados dos gráficos simulados — valores relativos, sem números específicos
const BAR_HEIGHTS = [38, 55, 44, 72, 58, 85, 67, 90] as const;
const LINE_POINTS = "0,32 13,26 26,29 39,14 52,19 65,9 78,12 91,6 100,4";
const REGION_BARS = [
  { label: "SP", w: 72 },
  { label: "RJ", w: 48 },
  { label: "MG", w: 34 },
  { label: "PR", w: 26 },
] as const;

function BarChart() {
  return (
    <div className="flex items-end gap-[3px] h-14 px-1">
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-foreground/15"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function LineChart() {
  return (
    <svg viewBox="0 0 100 40" className="w-full h-14" aria-hidden="true">
      <polyline
        points={LINE_POINTS}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground/25"
      />
    </svg>
  );
}

function DonutChart() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div
        className="relative w-12 h-12 shrink-0 rounded-full"
        style={{
          background:
            "conic-gradient(hsl(var(--foreground)/0.25) 0deg 200deg, hsl(var(--foreground)/0.10) 200deg 280deg, hsl(var(--foreground)/0.06) 280deg 360deg)",
        }}
      >
        <div className="absolute inset-[6px] rounded-full bg-background" />
      </div>
      <div className="space-y-1">
        {[["•", "Produto A", "52%"], ["·", "Produto B", "28%"], ["·", "Outros", "20%"]].map(
          ([sym, name, pct]) => (
            <div key={name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>{sym}</span>
              <span>{name}</span>
              <span className="ml-auto pl-2 font-medium text-foreground/60">{pct}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function HBarChart() {
  return (
    <div className="space-y-2 py-1">
      {REGION_BARS.map(({ label, w }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="w-5 text-[10px] text-muted-foreground shrink-0">{label}</span>
          <div className="flex-1 h-2 rounded-full bg-foreground/08 overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground/25"
              style={{ width: `${w}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const MOCK_CHARTS = [
  { label: "Receita por mês", chart: <BarChart /> },
  { label: "Top produtos", chart: <DonutChart /> },
  { label: "Clientes por região", chart: <HBarChart /> },
  { label: "Ticket médio", chart: <LineChart /> },
] as const;

export function HeroSection() {
  return (
    <section className="py-16 sm:py-24" data-testid="hero-section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Pill badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-xs text-muted-foreground">
            <span>Open source</span>
            <span className="w-px h-3 bg-border" aria-hidden="true" />
            <span>Gratuito</span>
            <span className="w-px h-3 bg-border" aria-hidden="true" />
            <span>Bring Your Own Key</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center text-4xl sm:text-6xl font-bold tracking-tighter text-foreground leading-tight">
          Sua planilha virou um dashboard
          <br />
          <span className="text-muted-foreground font-normal">
            sem configurar nada.
          </span>
        </h1>

        {/* Descrição */}
        <p className="mt-6 text-center text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Arraste um CSV, XLSX ou ODS. O PlanilhaDash detecta as colunas,
          escolhe os gráficos certos e deixa a IA analisar tudo — com a sua própria API Key.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" asChild>
            <Link href="/signup">Criar conta grátis</Link>
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <a href="#como-funciona">Ver como funciona</a>
          </Button>
        </div>

        {/* Mockup do produto */}
        <div
          className="mt-14 rounded-xl border bg-muted/20 p-4 shadow-sm"
          role="img"
          aria-label="Prévia do dashboard gerado pelo PlanilhaDash"
          data-testid="hero-mockup"
        >
          {/* Barra de status do arquivo */}
          <div className="rounded-lg border border-dashed bg-background px-5 py-3 flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">vendas-q4-2024.xlsx</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                1.240 linhas · 8 colunas detectadas
              </p>
            </div>
            <span className="text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">
              4 gráficos
            </span>
          </div>

          {/* Grid de gráficos */}
          <div className="grid grid-cols-2 gap-3">
            {MOCK_CHARTS.map(({ label, chart }) => (
              <div
                key={label}
                className="rounded-md bg-background border p-3 flex flex-col justify-between gap-2"
              >
                <span className="text-[11px] font-medium text-foreground/60">{label}</span>
                {chart}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
