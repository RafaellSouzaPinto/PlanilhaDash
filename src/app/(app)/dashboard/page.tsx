import Link from "next/link";
import { validateSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, BarChart2, FileSpreadsheet, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Histórico — PlanilhaDash" };

export default async function DashboardPage() {
  const validated = await validateSession();
  if (!validated) return null;

  const userReports = await db
    .select({
      id: reports.id,
      fileName: reports.fileName,
      rowCount: reports.rowCount,
      aiInsights: reports.aiInsights,
      createdAt: reports.createdAt,
    })
    .from(reports)
    .where(eq(reports.userId, validated.user.id))
    .orderBy(desc(reports.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Histórico de dashboards</h1>
          <p className="text-muted-foreground">
            Olá, {validated.user.name}. Seus relatórios salvos aparecem aqui.
          </p>
        </div>
        <Link href="/upload">
          <Button className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Nova planilha
          </Button>
        </Link>
      </div>

      {userReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum dashboard ainda</h2>
          <p className="text-muted-foreground mb-6">
            Faça upload de uma planilha para gerar seu primeiro dashboard
          </p>
          <Link href="/upload">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Carregar planilha
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-start gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="truncate">{report.fileName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">
                    {report.rowCount.toLocaleString("pt-BR")} linhas
                  </Badge>
                  {report.aiInsights !== null && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      Com análise de IA
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground mt-1 block">
                  {formatDate(report.createdAt)}
                </span>
              </CardContent>
              <CardFooter>
                <Link href={`/reports/${report.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    Ver dashboard
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
