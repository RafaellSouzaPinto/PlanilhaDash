import { notFound } from "next/navigation";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ChartGrid } from "@/components/dashboard/ChartGrid";
import { InsightsPanel } from "@/components/ai/InsightsPanel";
import { ExportButton } from "@/components/pdf/ExportButton";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { FileSpreadsheet } from "lucide-react";
import type { ColumnMeta, ChartConfig } from "@/types/spreadsheet";

interface PageProps {
  params: { id: string };
}

export default async function ReportPage({ params }: PageProps) {
  const validated = await validateSession();
  if (!validated) return null;

  const reportId = Number(params.id);
  if (!Number.isInteger(reportId) || reportId <= 0) {
    notFound();
  }

  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!report) {
    notFound();
  }

  // Ownership check — never show another user's report
  if (report.userId !== validated.user.id) {
    notFound();
  }

  // Drizzle + mysql2 pode retornar colunas json como string — normalizar para array
  const columnsMeta = (
    typeof report.columnsMeta === "string"
      ? JSON.parse(report.columnsMeta)
      : report.columnsMeta
  ) as ColumnMeta[];

  const chartsConfig = (
    typeof report.chartsConfig === "string"
      ? JSON.parse(report.chartsConfig)
      : report.chartsConfig
  ) as ChartConfig[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-8 w-8 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-2xl font-bold">{report.fileName}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary">
                {report.rowCount.toLocaleString("pt-BR")} linhas
              </Badge>
              <Badge variant="outline">
                {columnsMeta.length} colunas
              </Badge>
              <span className="text-sm text-muted-foreground">
                Salvo em {formatDate(report.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <ExportButton
          dashboardElementId="dashboard-export"
          fileName={report.fileName}
        />
      </div>

      {report.aiInsights && (
        <InsightsPanel insights={report.aiInsights} />
      )}

      <ChartGrid configs={chartsConfig} id="dashboard-export" />
    </div>
  );
}
