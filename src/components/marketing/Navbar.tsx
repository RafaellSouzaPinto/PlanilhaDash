import Link from "next/link";

export function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur"
      data-testid="marketing-navbar"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">

          <Link
            href="/"
            className="text-sm font-medium"
            aria-label="PlanilhaDash — página inicial"
          >
            <span className="font-normal text-muted-foreground">Planilha</span>
            <span className="font-bold text-foreground">Dash</span>
          </Link>

          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Entrar
          </Link>

        </div>
      </div>
    </header>
  );
}
