import Link from "next/link";

const NAV_GROUPS = [
  {
    label: "Produto",
    links: [
      { label: "Entrar", href: "/login", external: false },
      { label: "Criar conta", href: "/signup", external: false },
    ],
  },
  {
    label: "Projeto",
    links: [
      {
        label: "GitHub",
        href: "https://github.com/RafaellSouzaPinto/planilhadash",
        external: true,
      },
      {
        label: "Reportar bug",
        href: "https://github.com/RafaellSouzaPinto/planilhadash/issues",
        external: true,
      },
    ],
  },
] as const;

export function FooterSection() {
  return (
    <footer className="border-t bg-background" data-testid="footer-section">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Linha superior */}
        <div className="flex flex-col sm:flex-row justify-between gap-8">
          <div>
            <Link href="/" className="text-sm font-medium">
              <span className="font-normal text-muted-foreground">Planilha</span>
              <span className="font-bold text-foreground">Dash</span>
            </Link>
            <p className="mt-2 text-xs text-muted-foreground max-w-xs leading-relaxed">
              Transforme planilhas em dashboards visuais com análise de IA.
              Open source sob licença MIT.
            </p>
          </div>

          <div className="flex gap-12">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">
                  {group.label}
                </p>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Linha inferior */}
        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2025 PlanilhaDash · Licença MIT</p>
          <p>Feito com Next.js, Drizzle ORM e shadcn/ui</p>
        </div>

      </div>
    </footer>
  );
}
