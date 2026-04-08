# FRONTEND-SPEC.md — PlanilhaDash

> Paleta, tipografia, componentes CSS, layout de cada tela.

---

## Design System

**Base:** shadcn/ui com Tailwind CSS 3.x.
Paleta customizada não definida — usar os tokens padrão do shadcn/ui (CSS variables em `globals.css`).

### Tokens de cor padrão (shadcn/ui defaults)

```css
/* globals.css — gerado pelo shadcn/ui init */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

> Se uma paleta customizada for definida no futuro, atualizar esta seção com os novos tokens.

---

## Tipografia

- **Fonte:** padrão do sistema via Tailwind (`font-sans`)
- **Hierarquia:**
  - `text-2xl font-bold` — títulos de página
  - `text-xl font-semibold` — títulos de seção
  - `text-sm text-muted-foreground` — labels e metadados
  - `text-base` — corpo de texto

---

## Componentes shadcn/ui em uso

| Componente | Uso no projeto |
|-----------|----------------|
| `Button` | Ações primárias, logout, submit |
| `Input` | Campos de formulário (email, senha, nome) |
| `Label` | Labels de formulário |
| `Card` / `CardContent` / `CardHeader` | Container de gráficos, histórico |
| `Dialog` / `DialogContent` | Modal de configuração de API Key |
| `Select` | Seletor de provider de IA |
| `Badge` | Status de relatório |
| `Separator` | Divisores visuais |
| `Skeleton` | Loading state de gráficos e cards |
| `Alert` / `AlertDescription` | Erros de formulário, avisos |
| `DropdownMenu` | Menu de usuário (header) |
| `Table` | Tabela de fallback para dados |

---

## Layout Global

```
┌─────────────────────────────────────────────────┐
│  Header (fixo)                                  │
│  [Logo PlanilhaDash]          [User Menu ▼]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Conteúdo da página                             │
│  (max-w-7xl mx-auto px-4)                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

- Layout raiz: `src/app/layout.tsx`
- Layout autenticado: `src/app/(app)/layout.tsx` — inclui Header + verificação de sessão
- Rotas públicas `(auth)/*` — sem Header

---

## Telas

### `/login` e `/signup`

```
┌───────────────────────────────┐
│                               │
│      [Logo]                   │
│                               │
│   ┌───────────────────────┐   │
│   │  Card                 │   │
│   │  Título               │   │
│   │  Input email          │   │
│   │  Input senha          │   │
│   │  Button submit        │   │
│   │  Link para a outra    │   │
│   └───────────────────────┘   │
│                               │
└───────────────────────────────┘
```

- Layout centralizado: `min-h-screen flex items-center justify-center`
- Card: `w-full max-w-md`
- Erros inline abaixo do campo com `text-destructive text-sm`

---

### `/dashboard` (histórico)

```
┌─────────────────────────────────────────────────┐
│  Header                                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  Título: "Meus Relatórios"                      │
│  [Botão: Novo Upload]                           │
│                                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │ Card │  │ Card │  │ Card │  │ Card │  ...   │
│  │ rel. │  │ rel. │  │ rel. │  │ rel. │        │
│  └──────┘  └──────┘  └──────┘  └──────┘        │
│                                                 │
│  (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)   │
└─────────────────────────────────────────────────┘
```

- Card de relatório: nome do arquivo, data, número de linhas, botão "Ver"

---

### `/upload`

```
┌─────────────────────────────────────────────────┐
│  Header                                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  Título: "Novo Dashboard"                       │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Dropzone                               │   │
│  │  [ícone upload]                         │   │
│  │  "Arraste ou clique para enviar"        │   │
│  │  ".csv, .xlsx, .ods — máx 10MB"        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Preview do arquivo após seleção]              │
│  [Botão: Gerar Dashboard]                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

- Dropzone com `react-dropzone`: `border-2 border-dashed rounded-lg`
- Estado de drag: `border-primary bg-primary/5`
- Após seleção: mostrar nome, tamanho e ícone do tipo de arquivo

---

### Dashboard gerado (após upload)

```
┌─────────────────────────────────────────────────┐
│  Header                                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  "nome_do_arquivo.csv" · 1.234 linhas           │
│  [Botão: Exportar PDF]   [Botão: Salvar]        │
│                                                 │
│  ┌───────────────────┐  ┌───────────────────┐   │
│  │  Gráfico 1        │  │  Gráfico 2        │   │
│  └───────────────────┘  └───────────────────┘   │
│  ┌───────────────────┐  ┌───────────────────┐   │
│  │  Gráfico 3        │  │  Gráfico 4        │   │
│  └───────────────────┘  └───────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Insights de IA (Markdown renderizado)  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

- Grid de gráficos: `grid-cols-1 md:grid-cols-2 gap-4`
- Cada ChartCard: `Card` com título da combinação de colunas
- Gráficos via Recharts: `ResponsiveContainer width="100%" height={300}`

---

### Modal de API Key (`ApiKeyModal`)

```
┌────────────────────────────────┐
│  Dialog                        │
│  "Configurar IA"               │
│                                │
│  Select: Provider de IA        │
│  [OpenAI / Claude / Gemini / Groq]
│                                │
│  Input: API Key (type=password)│
│  ⚠ "Sua key é criptografada"   │
│                                │
│  [Ignorar]    [Salvar]         │
└────────────────────────────────┘
```

- Aparece automaticamente na primeira sessão (se `hasApiKey === false`)
- Disponível também via Settings

---

## Convenções de estilo

- **Responsive-first:** mobile → tablet → desktop com Tailwind breakpoints
- **Loading states:** sempre usar `Skeleton` do shadcn/ui — nunca spinner custom
- **Erros de formulário:** `text-destructive text-sm mt-1` abaixo do campo
- **Botão primário de ação:** `variant="default"` (fundo escuro)
- **Ações destrutivas:** `variant="destructive"`
- **Ações secundárias:** `variant="outline"` ou `variant="ghost"`
- **Ícones:** Lucide React (já incluso no shadcn/ui)
- **Sem animações customizadas** além das que o shadcn/ui já provê (Radix transitions)
