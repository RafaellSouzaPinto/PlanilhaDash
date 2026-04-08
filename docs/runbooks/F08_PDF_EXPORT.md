# F08 — Exportação PDF

**Componentes:** `components/pdf/ExportButton.tsx`
**Lib:** `src/lib/pdfExport.ts`
**Testes:** [T08_PDF_EXPORT.md](../testes/T08_PDF_EXPORT.md)

---

## Fluxo

```
Usuário clica [Exportar PDF]
  │  ExportButton → loading state
  ▼
exportDashboardToPDF("dashboard-container", fileName)
  │  html2canvas(element, { scale: 2, useCORS: true })
  │  → canvas PNG alta resolução
  │
  ├─ new jsPDF({ orientation, unit: "px", format: [w, h] })
  ├─ pdf.addImage(imgData, "PNG", 0, 0, w, h)
  └─ pdf.save("nome-dashboard.pdf")
  ▼
Loading state desativado — download automático no browser
```

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/lib/pdfExport.ts` | html2canvas + jsPDF |
| `src/components/pdf/ExportButton.tsx` | Botão com loading state |

---

## Código — `src/lib/pdfExport.ts`

```ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportDashboardToPDF(elementId: string, fileName: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Elemento #${elementId} não encontrado no DOM`);

  const canvas = await html2canvas(element, {
    scale:   2,       // alta resolução
    useCORS: true,    // necessário para imagens externas
    logging: false,
  });

  const imgData     = canvas.toDataURL("image/png");
  const orientation = canvas.width > canvas.height ? "landscape" : "portrait";

  const pdf = new jsPDF({
    orientation,
    unit:   "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);

  const baseName = fileName.replace(/\.[^.]+$/, "");
  pdf.save(`${baseName}-dashboard.pdf`);
}
```

## Código — `ExportButton.tsx`

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportDashboardToPDF } from "@/lib/pdfExport";

interface ExportButtonProps {
  elementId: string;
  fileName:  string;
}

export function ExportButton({ elementId, fileName }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      await exportDashboardToPDF(elementId, fileName);
    } catch (err) {
      console.error("Erro ao exportar PDF:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleExport} disabled={loading} variant="outline">
      <Download className="mr-2 h-4 w-4" />
      {loading ? "Gerando PDF..." : "Exportar PDF"}
    </Button>
  );
}
```

---

## Regras de negócio

1. Elemento alvo (`elementId`) deve ter `bg-white` explícito — `html2canvas` não herda fundo por padrão
2. Aguardar gráficos Recharts **completamente renderizados** antes de capturar (sem animações em curso)
3. Operação **100% client-side** — sem chamada ao servidor
4. `useCORS: true` obrigatório para imagens de domínios externos
5. `scale: 2` garante alta resolução — não reduzir abaixo de 1.5
