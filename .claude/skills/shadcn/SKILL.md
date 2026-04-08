# Skill: shadcn/ui

**Projeto:** PlanilhaDash
**Versão:** latest (gerado via `npx shadcn-ui@latest add`)

---

## Componentes em uso no projeto

| Componente | Import | Uso |
|-----------|--------|-----|
| Button | `@/components/ui/button` | Ações primárias, submit, logout |
| Input | `@/components/ui/input` | Campos de formulário |
| Label | `@/components/ui/label` | Labels de formulário |
| Card, CardContent, CardHeader, CardTitle | `@/components/ui/card` | Container de gráficos, cards de relatório |
| Dialog, DialogContent, DialogHeader, DialogTitle | `@/components/ui/dialog` | Modal de API Key |
| Select, SelectContent, SelectItem, SelectTrigger, SelectValue | `@/components/ui/select` | Seletor de provider de IA |
| Badge | `@/components/ui/badge` | Status |
| Separator | `@/components/ui/separator` | Divisores |
| Skeleton | `@/components/ui/skeleton` | Loading states |
| Alert, AlertDescription | `@/components/ui/alert` | Erros e avisos |
| DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger | `@/components/ui/dropdown-menu` | Menu do usuário no header |
| Table, TableBody, TableCell, TableHead, TableHeader, TableRow | `@/components/ui/table` | Tabela de fallback |

---

## Como adicionar novos componentes

```bash
npx shadcn-ui@latest add [nome-do-componente]
# Exemplo:
npx shadcn-ui@latest add tooltip
```

Os arquivos são gerados em `src/components/ui/` e são editáveis.

---

## Variantes de Button

```tsx
<Button variant="default">    Ação primária       </Button>
<Button variant="outline">    Ação secundária     </Button>
<Button variant="ghost">      Ação terciária      </Button>
<Button variant="destructive">Ação destrutiva     </Button>
<Button variant="link">       Link                </Button>
```

---

## Padrão de Dialog (Modal de API Key)

```tsx
"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ApiKeyModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar IA</DialogTitle>
        </DialogHeader>
        {/* conteúdo */}
      </DialogContent>
    </Dialog>
  );
}
```

---

## Skeleton (loading state)

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton de card de gráfico
<div className="grid grid-cols-2 gap-4">
  {Array.from({ length: 4 }).map((_, i) => (
    <Skeleton key={i} className="h-[320px] rounded-lg" />
  ))}
</div>
```

---

## Regras

- Nunca criar spinner customizado — usar `Skeleton` do shadcn/ui para loading states
- Não sobrescrever estilos de componentes shadcn com CSS global — usar `className` prop
- Não modificar arquivos em `src/components/ui/` a menos que seja necessário customização específica do projeto
- Ícones: usar exclusivamente Lucide React (já disponível via shadcn/ui)
