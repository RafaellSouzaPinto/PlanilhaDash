# M06 — Exportação PDF

**Status:** 🚧 Em desenvolvimento

---

## Arquivos envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/lib/pdfExport.ts` | html2canvas + jsPDF |
| `src/components/pdf/ExportButton.tsx` | Botão de exportação com loading state |

---

## Fluxo

```
Usuário clica [Exportar PDF]
  │
  ▼
ExportButton → loading state
  │
  ▼
exportDashboardToPDF("dashboard-container", fileName)
  │
  ├─ html2canvas(element, { scale: 2, useCORS: true })
  │  → canvas PNG de alta resolução
  │
  ├─ new jsPDF({ orientation, unit: "px", format: [w, h] })
  │
  ├─ pdf.addImage(imgData, "PNG", 0, 0, w, h)
  │
  └─ pdf.save("nome-arquivo-dashboard.pdf")
      │
      ▼
  Loading state desativado
```

---

## `src/lib/pdfExport.ts`

```ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportDashboardToPDF(elementId: string, fileName: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Elemento #${elementId} não encontrado no DOM`);

  const canvas = await html2canvas(element, {
    scale:   2,          // alta resolução
    useCORS: true,       // necessário para imagens externas
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
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

---

## ExportButton (`components/pdf/ExportButton.tsx`)

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

## Pontos de atenção

- `html2canvas` captura o DOM como está — garantir que todos os gráficos Recharts estejam **completamente renderizados** antes de chamar a função
- Se o dashboard tiver animações, aguardar a conclusão (`setTimeout` ou `requestAnimationFrame`) antes do export
- `useCORS: true` é necessário se houver imagens de domínios externos
- O elemento de destino (`elementId`) deve ter fundo branco explícito: `bg-white` no Tailwind
- Em mobile o PDF pode ficar muito grande — considerar limitar export a desktop (aviso na UI)
