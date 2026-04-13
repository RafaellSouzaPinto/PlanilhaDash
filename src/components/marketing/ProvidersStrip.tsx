const PROVIDERS = ["OpenAI", "Anthropic", "Google Gemini", "Groq"] as const;

export function ProvidersStrip() {
  return (
    <div className="border-y bg-muted/20 py-4" data-testid="providers-strip">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
          <span className="shrink-0 text-xs uppercase tracking-widest">
            Compatível com
          </span>
          <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2">
            {PROVIDERS.map((name) => (
              <span key={name} className="font-medium text-foreground/70">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
