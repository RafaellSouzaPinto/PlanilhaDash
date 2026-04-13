# M07 — Landing Page

**Status:** ✅ Implementado (V3 — upload-first)
**Módulo:** Página pública de apresentação do produto

> **Versão implementada:** [M07_LANDING_PAGE_V3.md](M07_LANDING_PAGE_V3.md) — landing upload-first com `LandingUpload` e gate por `localStorage`.
> Este arquivo descreve a V1 (marketing com seções). Os componentes de seção (`HeroSection`, `FeaturesSection`, etc.) existem em `src/components/marketing/` mas **não aparecem na página principal** — podem ser reutilizados em páginas futuras (`/sobre`, `/pricing`).


---

## Visão geral

A landing page é a nova tela inicial (`/`) do PlanilhaDash — visível para qualquer visitante, logado ou não.
Atualmente `/` redireciona imediatamente para `/login` ou `/dashboard`. Com este módulo, o comportamento muda:

| Situação | Comportamento atual | Comportamento novo |
|----------|--------------------|--------------------|
| Visitante não autenticado | Redirect → `/login` | Exibe landing page |
| Usuário autenticado | Redirect → `/dashboard` | Redirect → `/dashboard` (inalterado) |

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/app/page.tsx` | Página raiz — lógica de redirect (autenticado) ou render (visitante) |
| `src/app/(marketing)/layout.tsx` | Layout sem Header do app — apenas barra de navegação pública |
| `src/app/(marketing)/page.tsx` | Conteúdo da landing page (seções) |
| `src/components/marketing/Navbar.tsx` | Barra de navegação pública (Logo + CTA) |
| `src/components/marketing/HeroSection.tsx` | Seção hero com headline, subtítulo e CTAs |
| `src/components/marketing/FeaturesSection.tsx` | Grid de funcionalidades do produto |
| `src/components/marketing/HowItWorksSection.tsx` | Passo a passo visual (3 etapas) |
| `src/components/marketing/CtaSection.tsx` | Seção final de chamada para ação |
| `src/components/marketing/FooterSection.tsx` | Rodapé com links e copyright |

---

## Estrutura de rotas

```
app/
├── page.tsx                     ← redirect se autenticado, senão render landing
├── (marketing)/                 ← route group — rotas públicas com layout marketing
│   ├── layout.tsx               ← Navbar pública (sem Header do app)
│   └── page.tsx                 ← conteúdo da landing page
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
└── (app)/
    ├── dashboard/page.tsx
    └── ...
```

> **Alternativa de implementação:** manter tudo em `src/app/page.tsx` diretamente (Server Component), sem route group separado, se as seções forem Server Components simples sem estado.

---

## Fluxo

```
GET /
  │
  ▼
app/page.tsx (Server Component)
  │
  ├─ validateSession() → sucesso
  │   └─ redirect("/dashboard")
  │
  └─ validateSession() → falha (sem sessão)
      └─ render <LandingPage />
           │
           ├─ <Navbar />          ← Logo + "Entrar" + "Criar conta"
           ├─ <HeroSection />     ← Headline + subtítulo + 2 CTAs
           ├─ <FeaturesSection /> ← 6 cards de funcionalidades
           ├─ <HowItWorksSection /> ← 3 etapas numeradas
           ├─ <CtaSection />      ← Banner final de conversão
           └─ <FooterSection />   ← Links + copyright
```

---

## Seções detalhadas

### Navbar (`components/marketing/Navbar.tsx`)

```
┌─────────────────────────────────────────────────────────────┐
│  [📊 PlanilhaDash]                    [Entrar]  [Criar conta]│
└─────────────────────────────────────────────────────────────┘
```

- Fundo: `bg-white border-b` — fixo no topo (`sticky top-0 z-50`)
- Logo: ícone `BarChart3` (lucide-react) + texto "PlanilhaDash"
- CTA direita: `Button variant="ghost"` → `/login` e `Button variant="default"` → `/signup`
- Em mobile: ambos os botões permanecem visíveis (sem hamburguer nesta versão)

---

### Hero (`components/marketing/HeroSection.tsx`)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   Transforme planilhas em                                │
│   dashboards visuais                                     │
│   em segundos                                            │
│                                                          │
│   Upload CSV, XLSX ou ODS → gráficos automáticos         │
│   → análise com IA → exportação PDF                      │
│                                                          │
│   [🚀 Começar grátis]   [Ver demonstração ↓]             │
│                                                          │
│   ✓ Sem cartão de crédito   ✓ Open source                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Headline: `text-4xl font-bold tracking-tight` (desktop: `text-5xl`)
- Subtítulo: `text-lg text-muted-foreground max-w-xl`
- CTA primário: `Button size="lg"` → `/signup`
- CTA secundário: `Button size="lg" variant="outline"` → smooth scroll para `#como-funciona`
- Badges: ✓ Sem cartão de crédito · ✓ Open source (`text-sm text-muted-foreground`)
- Fundo: `bg-gradient-to-b from-muted/30 to-background`

---

### Features (`components/marketing/FeaturesSection.tsx`)

**Título da seção:** "Tudo que você precisa para visualizar seus dados"

Grid 3 colunas (desktop) / 1 coluna (mobile) com 6 cards:

| Ícone (lucide) | Título | Descrição |
|----------------|--------|-----------|
| `Upload` | Upload universal | Suporte a CSV, XLSX e ODS — arraste ou clique |
| `BarChart3` | Gráficos automáticos | Detecção de colunas e geração de até 4 gráficos sem configuração |
| `Sparkles` | Análise com IA | OpenAI, Claude, Gemini e Groq — use sua própria API Key |
| `FileText` | Histórico completo | Todos os seus relatórios salvos e acessíveis a qualquer momento |
| `Download` | Exportação PDF | Baixe seu dashboard como PDF com um clique |
| `Lock` | Sua chave, sua privacidade | API Keys criptografadas com AES-256-GCM — nunca expostas |

Cada card usa `Card` do shadcn/ui com ícone colorido em `text-primary`, título `font-semibold` e descrição `text-sm text-muted-foreground`.

---

### How It Works (`components/marketing/HowItWorksSection.tsx`)

**ID:** `id="como-funciona"` — destino do CTA secundário do Hero

**Título:** "Como funciona"
**Subtítulo:** "Três passos para seu dashboard estar pronto"

```
   [1]                    [2]                    [3]
Upload da planilha    Gráficos gerados       Insights com IA
   │                       │                      │
Arraste seu CSV,      Detecção automática    Conecte sua API
XLSX ou ODS           de colunas e           Key e obtenha
                      criação dos gráficos   análise em segundos
```

Layout: `flex gap-8` em desktop, stack em mobile.
Número da etapa: círculo `w-10 h-10 rounded-full bg-primary text-primary-foreground`.
Conector visual entre etapas: linha horizontal `hidden md:block border-t-2 border-dashed border-muted-foreground/30` (só desktop).

---

### CTA Section (`components/marketing/CtaSection.tsx`)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   Pronto para transformar suas planilhas?                │
│   Comece agora, é gratuito e open source.                │
│                                                          │
│              [Criar conta grátis →]                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Fundo: `bg-primary text-primary-foreground rounded-2xl`
- Título: `text-3xl font-bold`
- Botão: `Button size="lg" variant="secondary"` → `/signup`

---

### Footer (`components/marketing/FooterSection.tsx`)

```
┌──────────────────────────────────────────────────────────┐
│  [📊 PlanilhaDash]          GitHub   Documentação        │
│  © 2025 PlanilhaDash. Open source sob licença MIT.       │
└──────────────────────────────────────────────────────────┘
```

- Layout: `flex justify-between items-center`
- Links: `text-sm text-muted-foreground hover:text-foreground`
- GitHub: link externo para o repositório
- Sem dados sensíveis, sem formulários

---

## `src/app/page.tsx` — lógica atualizada

```ts
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/session";
import { Navbar } from "@/components/marketing/Navbar";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { CtaSection } from "@/components/marketing/CtaSection";
import { FooterSection } from "@/components/marketing/FooterSection";

export const metadata = {
  title: "PlanilhaDash — Dashboards a partir de planilhas",
  description:
    "Transforme CSV, XLSX e ODS em dashboards visuais interativos com análise de IA.",
};

export default async function RootPage() {
  const validated = await validateSession().catch(() => null);

  if (validated) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <FooterSection />
    </div>
  );
}
```

> `validateSession` lança exceção quando não há sessão — usar `.catch(() => null)` para tratar sem try/catch.

---

## Middleware — ajuste necessário

O middleware atual redireciona `/` para `/login` quando não há sessão. Deve ser atualizado para **não** interceptar `/`:

```ts
// src/middleware.ts
export const config = {
  matcher: [
    // Protege apenas rotas do app — exclui raiz e rotas de marketing
    "/(app)/:path*",
  ],
};
```

Rotas públicas (`/`, `/login`, `/signup`) **não entram** no matcher — sem necessidade de lógica adicional no middleware.

---

## Responsividade

| Breakpoint | Comportamento |
|-----------|---------------|
| Mobile (`< sm`) | Stack vertical, texto centralizado, botões full-width |
| Tablet (`sm–lg`) | Grid 2 colunas nas features |
| Desktop (`>= lg`) | Grid 3 colunas nas features, layout horizontal no How It Works |

---

## Regras de negócio

1. A landing page é **completamente pública** — sem cookies, sem sessão, sem dados do usuário
2. Usuário autenticado que acessa `/` é redirecionado para `/dashboard` imediatamente
3. Nenhuma chamada de API é feita na landing page — é estática
4. Nenhum dado sensível (chaves, emails, sessões) é exposto ou referenciado
5. Links para GitHub apontam para o repositório real — não usar URLs fictícias

---

## Testes relacionados

Ver [../testes/T11_LANDING_PAGE.md](../testes/T11_LANDING_PAGE.md)
