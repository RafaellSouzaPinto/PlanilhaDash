import Link from "next/link";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/session";
import { Navbar } from "@/components/marketing/Navbar";
import { LandingUpload } from "@/components/marketing/LandingUpload";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "PlanilhaDash — Dashboards a partir de planilhas",
  description:
    "Arraste uma planilha CSV, XLSX ou ODS e veja o dashboard aparecer em segundos.",
};

export default async function RootPage() {
  const session = await validateSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-2xl space-y-10">

          {/* Headline + subtítulo */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-foreground leading-tight">
              Arraste sua planilha.
              <br />
              <span className="font-normal text-muted-foreground">
                Veja o dashboard aparecer.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Transforme CSV, XLSX ou ODS em gráficos interativos em segundos.
              Sem fórmulas, sem configuração, sem aprender ferramenta nova.
            </p>
          </div>

          {/* CTAs primários */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="text-base px-8" asChild>
              <Link href="/signup">Criar conta grátis</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>

          {/* Separador */}
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground px-2">
              ou teste agora, sem cadastro
            </span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Dropzone + estados do trial */}
          <LandingUpload />

          <p className="text-center text-xs text-muted-foreground">
            CSV, XLSX ou ODS · Grátis, sem cadastro · Resultado em segundos
          </p>

        </div>
      </main>
    </div>
  );
}
