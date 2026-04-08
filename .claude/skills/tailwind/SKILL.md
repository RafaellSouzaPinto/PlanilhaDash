# Skill: Tailwind CSS

**Projeto:** PlanilhaDash
**Versão:** Tailwind CSS 3.x

---

## Configuração

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Extensões customizadas aqui se necessário
    },
  },
  plugins: [require("tailwindcss-animate")], // usado pelo shadcn/ui
} satisfies Config;
```

---

## Breakpoints

| Prefixo | Tamanho | Uso típico |
|---------|---------|-----------|
| (sem prefixo) | mobile first | base |
| `sm:` | >= 640px | tablet pequeno |
| `md:` | >= 768px | tablet |
| `lg:` | >= 1024px | desktop |
| `xl:` | >= 1280px | desktop largo |

---

## Padrões do projeto

### Layout de página

```tsx
// Container padrão de conteúdo
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
```

### Grid de gráficos

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {charts.map(...)}
</div>
```

### Grid de cards (histórico)

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Centralização de tela (auth)

```tsx
<div className="min-h-screen flex items-center justify-center bg-background">
  <div className="w-full max-w-md px-4">
```

### Estados interativos

```tsx
// Dropzone com drag ativo
<div className={cn(
  "border-2 border-dashed rounded-lg p-8 transition-colors",
  isDragging ? "border-primary bg-primary/5" : "border-border"
)}>
```

---

## Utilitários frequentes

```ts
// cn() — combinar classes com clsx + tailwind-merge (já incluso no shadcn/ui)
import { cn } from "@/lib/utils";

// Exemplo
<div className={cn("base-classes", condition && "conditional-class", className)} />
```

---

## Regras

- Sempre usar `cn()` para classes condicionais — nunca concatenação de string
- Não usar valores arbitrários (`w-[347px]`) quando existir classe padrão equivalente
- Priorizar classes do shadcn/ui (`bg-background`, `text-foreground`, `border-border`) para manter consistência com o tema
- Não definir cores hardcoded (`bg-blue-500`) para elementos de UI — usar tokens semânticos
- Exceção: cores de gráficos (Recharts) podem usar valores Tailwind fixos
