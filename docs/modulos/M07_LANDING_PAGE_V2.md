# M07-V2 — Landing Page: Redesign

**Antecede:** [M07_LANDING_PAGE.md](M07_LANDING_PAGE.md)
**Status:** 📋 Especificado

---

## Problema com a versão atual

A V1 tem aparência de landing page gerada por IA. Os sintomas são identificáveis e devem ser corrigidos sistematicamente:

| Componente | Problema específico |
|------------|-------------------|
| **Hero** | Emoji no botão (`🚀`), checkmarks textuais (`✓`), copy com setas encadeadas (`→ → →`), headline genérica |
| **FeaturesSection** | Grid 3×2 de cards com ícone em caixinha colorida + título + descrição — padrão mais usado em landing pages de IA |
| **HowItWorksSection** | Círculos numerados com linha tracejada entre eles — clichê visual de "3 passos" |
| **CtaSection** | Bloco retangular com `bg-primary`, texto centralizado, botão único — idêntico a centenas de SaaS clones |
| **Navbar** | `BarChart2` como logo — ícone genérico sem identidade |
| **Copy geral** | "Transforme X em Y em segundos", "Tudo que você precisa para Z", "Pronto para transformar" — frases de template |

---

## Referências de qualidade

Landing pages com identity própria e copy humano:

- **Linear.app** — headlines diretas, sem emoji, sem ícones em caixinhas, foco no produto real
- **Raycast** — screenshot do produto no hero, sem "3 passos" genéricos
- **Vercel** — copy técnico mas acessível, sem exagero de ícones, tipografia como elemento visual
- **Turso** — stats reais como social proof, tom de comunidade

---

## Princípios do redesign

1. **Nenhum emoji fora de contexto** — remover `🚀`, `✓` como bullet, setas `→` em copy de parágrafo
2. **Ícones como apoio, não protagonistas** — quando usados, sem caixinha colorida, apenas inline e discretos
3. **Copy específico** — dizer o que o produto faz de forma concreta, não o que qualquer SaaS poderia dizer
4. **Produto visível** — o hero deve mostrar algo que se pareça com o produto real (mockup estrutural)
5. **Tipografia como design** — usar tamanho, peso e espaçamento para criar hierarquia, não ícones
6. **Sem "3 passos"** — substituir por uma seção que demonstra o fluxo de forma mais editorial

---

## Alterações por componente

---

### Navbar — alterações

**Problema:** `BarChart2` é um ícone genérico. Qualquer dashboard SaaS usa esse ícone.

**Solução:** Logo tipográfico com duas fontes/pesos — sem ícone externo.

```
[Planilha·Dash]    [GitHub ↗]    [Entrar]    [Criar conta →]
```

- Logo: `Planilha` em `font-normal` + `Dash` em `font-bold` — diferenciação visual dentro do texto
- Adicionar link para GitHub no centro da nav (relevante para projeto open source)
- CTA primário: "Criar conta" sem seta — seta no texto é artificial
- Remover ícone `BarChart2`

**Código novo:**

```tsx
// src/components/marketing/Navbar.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur" data-testid="marketing-navbar">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">

          <Link href="/" className="text-sm font-medium" aria-label="PlanilhaDash — página inicial">
            <span className="font-normal text-muted-foreground">Planilha</span>
            <span className="font-bold text-foreground">Dash</span>
          </Link>

          <nav className="flex items-center gap-6">
            <a
              href="https://github.com/RafaellSouzaPinto/planilhadash"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              GitHub
            </a>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Button size="sm" asChild>
              <Link href="/signup">Criar conta</Link>
            </Button>
          </nav>

        </div>
      </div>
    </header>
  );
}
```

---

### HeroSection — alterações

**Problemas:**
- `🚀 Começar grátis` — emoji em botão é sinal de amadorismo
- `Upload de CSV → detecção → gráficos → análise → PDF` — lista com setas é copy de template
- `✓ Sem cartão de crédito · ✓ Open source` — checkmarks textuais são visuais genéricos
- Não mostra o produto em nenhum momento

**Solução:**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  open source                           gratuito  │   │  ← pill badge discreto (sem ✓)
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│   Sua planilha virou um                                 │
│   dashboard antes de você                               │
│   terminar o café.                                      │  ← headline humana, específica
│                                                         │
│   Arraste um CSV, XLSX ou ODS. O PlanilhaDash detecta   │
│   as colunas, gera os gráficos e ainda deixa a IA       │
│   analisar tudo por você.                               │  ← descrição em prosa, não em lista
│                                                         │
│        [Criar conta grátis]  [Ver o produto]            │  ← sem emoji, sem seta
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │   [MOCKUP DO DASHBOARD — div estrutural]        │   │  ← produto visível
│  │   barra de upload + cards de gráfico            │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Pill badge:** `<span>` com `border rounded-full px-3 py-1 text-xs text-muted-foreground` — sem ícones, sem ✓

**Mockup do produto:** `div` estilizado que simula visualmente o dashboard:

```tsx
<div className="mt-16 rounded-xl border bg-muted/30 p-4 shadow-sm">
  {/* Barra de upload simulada */}
  <div className="rounded-lg border border-dashed bg-background p-6 text-center mb-4">
    <p className="text-sm text-muted-foreground">vendas-q4-2024.xlsx</p>
    <p className="text-xs text-muted-foreground/60 mt-1">1.240 linhas · 8 colunas detectadas</p>
  </div>
  {/* Grid de gráficos simulado */}
  <div className="grid grid-cols-2 gap-3">
    {[
      { label: "Receita por mês", h: "h-28" },
      { label: "Top produtos", h: "h-28" },
      { label: "Clientes por região", h: "h-20" },
      { label: "Ticket médio", h: "h-20" },
    ].map(({ label, h }) => (
      <div key={label} className={`rounded-md bg-background border ${h} flex items-end p-3`}>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    ))}
  </div>
</div>
```

> O mockup usa dados verossímeis (`vendas-q4-2024.xlsx`, `1.240 linhas`) para parecer real sem precisar de screenshot.

**Código novo:**

```tsx
// src/components/marketing/HeroSection.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

const MOCK_CHARTS = [
  { label: "Receita por mês", height: "h-28" },
  { label: "Top produtos", height: "h-28" },
  { label: "Clientes por região", height: "h-20" },
  { label: "Ticket médio", height: "h-20" },
] as const;

export function HeroSection() {
  return (
    <section className="py-16 sm:py-24" data-testid="hero-section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Pill badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-xs text-muted-foreground">
            <span>Open source</span>
            <span className="w-px h-3 bg-border" />
            <span>Gratuito</span>
            <span className="w-px h-3 bg-border" />
            <span>Bring Your Own Key</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-center text-4xl sm:text-6xl font-bold tracking-tighter text-foreground leading-tight">
          Sua planilha virou um dashboard
          <br />
          <span className="text-muted-foreground font-normal">antes de você terminar o café.</span>
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
        >
          <div className="rounded-lg border border-dashed bg-background p-5 text-center mb-4">
            <p className="text-sm font-medium text-foreground">vendas-q4-2024.xlsx</p>
            <p className="text-xs text-muted-foreground mt-1">1.240 linhas · 8 colunas detectadas</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MOCK_CHARTS.map(({ label, height }) => (
              <div
                key={label}
                className={`rounded-md bg-background border ${height} flex items-end p-3`}
              >
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
```

---

### FeaturesSection — alterações

**Problema:** Grid 3×2 com ícone em caixinha colorida é o padrão mais reproduzido por geradores de landing page. Não transmite credibilidade nem identidade.

**Solução:** Layout editorial. Duas seções:

1. **Três features principais** — layout alternado esquerda/direita, texto + mockup contextual em vez de ícone
2. **Features secundárias** — lista compacta horizontal, sem cards, sem ícones em caixa

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Upload, e pronto.                                       │
│                                                          │
│  Texto descritivo da feature    │  [Mockup contextual]  │
│  de upload sem ícone            │                        │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  [Mockup contextual]  │  Análise com IA.                 │
│                       │  Texto descritivo                 │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  Histórico de todos os relatórios.                       │
│                                                          │
│  Texto descritivo               │  [Mockup contextual]  │
│                                 │                        │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Também inclui:                                          │
│  Exportação PDF  ·  4 formatos de gráfico  ·  AES-256   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Mockups contextuais** — divs estilizadas que simulam a feature, não imagens reais:

- Upload: drop zone com nome de arquivo e tamanho
- IA: caixa de texto simulando output de insight em markdown
- Histórico: lista de 3 relatórios com data e nome

**Código novo:**

```tsx
// src/components/marketing/FeaturesSection.tsx

const SECONDARY_FEATURES = [
  "Exportação PDF com um clique",
  "Até 4 gráficos por dashboard",
  "Barra, pizza, linha e área",
  "Criptografia AES-256-GCM",
  "OpenAI, Claude, Gemini e Groq",
  "Histórico de relatórios",
] as const;

function Divider() {
  return <hr className="border-border" />;
}

function UploadMockup() {
  return (
    <div className="rounded-lg border bg-background p-4 text-sm space-y-2">
      <div className="rounded border border-dashed p-4 text-center bg-muted/30">
        <p className="font-medium text-foreground text-xs">vendas-2024.xlsx</p>
        <p className="text-muted-foreground text-xs mt-0.5">2,4 MB · pronto</p>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
        <span>8 colunas detectadas</span>
        <span>1.240 linhas</span>
      </div>
    </div>
  );
}

function AiMockup() {
  return (
    <div className="rounded-lg border bg-background p-4 space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">Análise — Claude 3.5</p>
      <div className="space-y-1.5 text-xs text-foreground leading-relaxed">
        <p>A receita cresceu <strong>34%</strong> no Q4 comparado ao Q3.</p>
        <p>O produto com maior margem é <strong>Plano Pro</strong>, representando 61% do faturamento.</p>
        <p className="text-muted-foreground">Pico de vendas: sextas-feiras entre 14h–17h.</p>
      </div>
    </div>
  );
}

function HistoryMockup() {
  const items = [
    { name: "vendas-q4-2024.xlsx", date: "há 2 dias" },
    { name: "clientes-novembro.csv", date: "há 1 semana" },
    { name: "estoque-outubro.ods", date: "há 3 semanas" },
  ];
  return (
    <div className="rounded-lg border bg-background divide-y text-sm">
      {items.map(({ name, date }) => (
        <div key={name} className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-medium text-foreground truncate max-w-[160px]">{name}</span>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">{date}</span>
        </div>
      ))}
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="py-20 border-t" data-testid="features-section">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* Feature 1 — Upload */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Upload</p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Jogue o arquivo. O resto é por nossa conta.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              CSV, XLSX ou ODS — o PlanilhaDash lê o arquivo, detecta o tipo de cada coluna
              e já monta os gráficos mais adequados. Sem formulários de mapeamento,
              sem escolher qual coluna vai em qual eixo.
            </p>
          </div>
          <UploadMockup />
        </div>

        <Divider />

        {/* Feature 2 — IA */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <AiMockup />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Análise com IA</p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Sua chave. Seu modelo. Seus dados.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Conecte sua própria API Key de OpenAI, Claude, Gemini ou Groq.
              O PlanilhaDash envia uma amostra dos dados e devolve uma análise
              em linguagem natural — sem intermediários e sem armazenar sua chave em texto puro.
            </p>
          </div>
        </div>

        <Divider />

        {/* Feature 3 — Histórico */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Histórico</p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Todo relatório salvo, acessível na hora.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Cada upload gera um relatório com gráficos e insights que ficam salvos na sua conta.
              Acesse qualquer um deles, exporte em PDF ou compartilhe o link — quando quiser.
            </p>
          </div>
          <HistoryMockup />
        </div>

        <Divider />

        {/* Features secundárias */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Também inclui</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {SECONDARY_FEATURES.map((feature) => (
              <span key={feature} className="text-sm text-muted-foreground">
                {feature}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
```

---

### HowItWorksSection — alterações

**Problema:** Círculo numerado + linha tracejada horizontal é o layout mais copiado de landing pages. A linha tracejada dá um ar especialmente genérico.

**Solução:** Layout vertical com número tipográfico grande como elemento visual, e texto alinhado à esquerda — menos "3 passos ilustrados", mais editorial.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Como o PlanilhaDash funciona                            │
│                                                          │
│  01   Faça upload da planilha                            │
│       Arraste o arquivo para a área de upload. Suporte   │
│       nativo a CSV, XLSX e ODS. Sem conta especial,      │
│       sem plugin, sem configuração de schema.            │
│                                                          │
│  02   Os gráficos aparecem automaticamente               │
│       A engine detecta o tipo de cada coluna — numérica, │
│       categórica, data — e escolhe até 4 gráficos        │
│       relevantes para aquele conjunto de dados.          │
│                                                          │
│  03   Peça uma análise à IA                              │
│       Com sua API Key configurada, o sistema envia uma   │
│       amostra para o modelo de sua escolha e devolve     │
│       os insights em texto na mesma tela.                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Número: `text-5xl font-bold text-muted-foreground/20` — gigante, como elemento tipográfico de fundo, não como UI
- Sem linha tracejada
- Layout vertical em todas as telas (sem flip para horizontal)
- `id="como-funciona"` mantido para a âncora do Hero

**Código novo:**

```tsx
// src/components/marketing/HowItWorksSection.tsx

const STEPS = [
  {
    number: "01",
    title: "Faça upload da planilha",
    description:
      "Arraste o arquivo para a área de upload. Suporte nativo a CSV, XLSX e ODS. " +
      "Sem conta especial, sem plugin, sem configuração de schema — só o arquivo.",
  },
  {
    number: "02",
    title: "Os gráficos aparecem automaticamente",
    description:
      "A engine detecta o tipo de cada coluna — numérica, categórica, data — e escolhe " +
      "até 4 gráficos relevantes para aquele conjunto de dados.",
  },
  {
    number: "03",
    title: "Peça uma análise à IA",
    description:
      "Com sua API Key configurada, o sistema envia uma amostra para o modelo de sua escolha " +
      "e devolve os insights em texto na mesma tela. OpenAI, Claude, Gemini ou Groq.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="py-20 border-t"
      data-testid="how-it-works-section"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-12">
          Como o PlanilhaDash funciona
        </h2>

        <div className="space-y-12">
          {STEPS.map((step) => (
            <div key={step.number} className="grid grid-cols-[4rem_1fr] gap-6 items-start">
              <span className="text-5xl font-bold text-muted-foreground/20 leading-none select-none">
                {step.number}
              </span>
              <div>
                <h3 className="font-semibold text-foreground text-lg">{step.title}</h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
```

---

### CtaSection — alterações

**Problema:** Bloco retangular `bg-primary` centralizado com um botão é o componente de CTA mais clonado no ecossistema shadcn/ui. Qualquer pessoa que usa templates reconhece imediatamente.

**Solução:** CTA tipográfico — headline grande, sem caixa colorida, o impacto vem da tipografia.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Arraste sua planilha                                    │
│  e veja o resultado.                                     │
│                                                          │
│  Grátis, sem cartão. O código está no GitHub.            │
│                                                          │
│  [Criar conta grátis]                                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Sem `bg-primary` como bloco
- Fundo: `bg-muted/30` — neutro
- Headline: `text-4xl sm:text-5xl font-bold tracking-tighter` — o tamanho é o impacto
- Texto secundário: curto e informativo, não motivacional
- Alinhamento: esquerda (não centralizado — centralizado com bloco colorido é o clichê)

**Código novo:**

```tsx
// src/components/marketing/CtaSection.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-20 border-t bg-muted/20" data-testid="cta-section">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter text-foreground leading-tight">
          Arraste sua planilha
          <br />e veja o resultado.
        </h2>

        <p className="mt-4 text-muted-foreground">
          Grátis, sem cartão de crédito. O código está no{" "}
          <a
            href="https://github.com/RafaellSouzaPinto/planilhadash"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          .
        </p>

        <div className="mt-8">
          <Button size="lg" asChild>
            <Link href="/signup">Criar conta grátis</Link>
          </Button>
        </div>

      </div>
    </section>
  );
}
```

---

### FooterSection — alterações

**Problema:** Footer atual é funcional mas anêmico — parece incompleto.

**Solução:** Dois níveis — linha superior com logo + navegação agrupada, linha inferior com copyright e MIT. Para projeto open source, adicionar crédito explícito a tecnologias principais.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  PlanilhaDash          Produto       Projeto             │
│                        Entrar        GitHub              │
│                        Criar conta   Documentação        │
│                                      Reportar bug        │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  © 2025 PlanilhaDash · MIT · Feito com Next.js,          │
│  Drizzle ORM e shadcn/ui                                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Código novo:**

```tsx
// src/components/marketing/FooterSection.tsx
import Link from "next/link";

const NAV_GROUPS = [
  {
    label: "Produto",
    links: [
      { label: "Entrar", href: "/login", external: false },
      { label: "Criar conta", href: "/signup", external: false },
    ],
  },
  {
    label: "Projeto",
    links: [
      { label: "GitHub", href: "https://github.com/RafaellSouzaPinto/planilhadash", external: true },
      { label: "Reportar bug", href: "https://github.com/RafaellSouzaPinto/planilhadash/issues", external: true },
    ],
  },
] as const;

export function FooterSection() {
  return (
    <footer className="border-t bg-background" data-testid="footer-section">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Linha superior */}
        <div className="flex flex-col sm:flex-row justify-between gap-8">
          <div>
            <Link href="/" className="text-sm font-medium">
              <span className="font-normal text-muted-foreground">Planilha</span>
              <span className="font-bold text-foreground">Dash</span>
            </Link>
            <p className="mt-2 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Transforme planilhas em dashboards visuais com análise de IA.
              Open source sob licença MIT.
            </p>
          </div>

          <div className="flex gap-12">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">
                  {group.label}
                </p>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Linha inferior */}
        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2025 PlanilhaDash · Licença MIT</p>
          <p>Feito com Next.js, Drizzle ORM e shadcn/ui</p>
        </div>

      </div>
    </footer>
  );
}
```

---

## Seção nova: ProvidersStrip

Adicionar uma faixa discreta entre Hero e Features mostrando os providers de IA suportados — funciona como social proof técnica sem exagero.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Compatível com                                          │
│  OpenAI · Anthropic · Google Gemini · Groq               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Arquivo:** `src/components/marketing/ProvidersStrip.tsx`

```tsx
// src/components/marketing/ProvidersStrip.tsx

const PROVIDERS = ["OpenAI", "Anthropic", "Google Gemini", "Groq"] as const;

export function ProvidersStrip() {
  return (
    <div className="border-y bg-muted/20 py-4" data-testid="providers-strip">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
          <span className="shrink-0 text-xs uppercase tracking-widest">Compatível com</span>
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2">
            {PROVIDERS.map((name) => (
              <span key={name} className="font-medium text-foreground/70">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Adicionar em `src/app/page.tsx`:**

```tsx
import { ProvidersStrip } from "@/components/marketing/ProvidersStrip";

// entre HeroSection e FeaturesSection:
<HeroSection />
<ProvidersStrip />
<FeaturesSection />
```

---

## Resumo das mudanças

| Componente | V1 (problema) | V2 (solução) |
|------------|--------------|-------------|
| `Navbar` | Ícone BarChart2 genérico | Logo tipográfico Planilha**Dash** |
| `HeroSection` | Emoji, setas, checkmarks, sem produto | Pill badge, copy humano, mockup do produto |
| `FeaturesSection` | Grid 6 cards com ícones em caixinha | Layout editorial alternado + lista secundária |
| `HowItWorksSection` | Círculos + linha tracejada | Números tipográficos grandes, layout vertical |
| `CtaSection` | Bloco colorido centralizado | CTA tipográfico alinhado à esquerda |
| `FooterSection` | Footer anêmico | Dois níveis com grupos de navegação |
| `ProvidersStrip` | Inexistente | Faixa de compatibilidade entre Hero e Features |

---

## Arquivos a criar/alterar

| Ação | Arquivo |
|------|---------|
| Alterar | `src/components/marketing/Navbar.tsx` |
| Alterar | `src/components/marketing/HeroSection.tsx` |
| Alterar | `src/components/marketing/FeaturesSection.tsx` |
| Alterar | `src/components/marketing/HowItWorksSection.tsx` |
| Alterar | `src/components/marketing/CtaSection.tsx` |
| Alterar | `src/components/marketing/FooterSection.tsx` |
| Criar | `src/components/marketing/ProvidersStrip.tsx` |
| Alterar | `src/app/page.tsx` — adicionar ProvidersStrip |

---

## Testes

Os testes existentes em `tests/unit/marketing/` continuam válidos na maioria.
Ajustes necessários:

| Teste | Ajuste |
|-------|--------|
| `Navbar.test.tsx` | Remover teste do ícone BarChart2; verificar logo tipográfico |
| `HeroSection.test.tsx` | Atualizar texto do CTA (`"Criar conta grátis"`, sem emoji); testar mockup com `role="img"` |
| `FeaturesSection.test.tsx` | Atualizar para h2 por feature (não mais 1 h2 geral + 6 h3); testar mockups |
| `HowItWorksSection.test.tsx` | Verificar números `"01"`, `"02"`, `"03"` em vez de `"1"`, `"2"`, `"3"` |
| `CtaSection.test.tsx` | Atualizar texto do botão e do h2 |
| `FooterSection.test.tsx` | Adicionar teste para grupos de navegação; testar link "Reportar bug" |
| Criar | `tests/unit/marketing/ProvidersStrip.test.tsx` |
