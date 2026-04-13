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
