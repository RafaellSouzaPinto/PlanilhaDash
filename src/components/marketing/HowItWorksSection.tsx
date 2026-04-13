const STEPS = [
  {
    number: "01",
    title: "Faça upload da planilha",
    description:
      "Arraste o arquivo para a área de upload. Suporte nativo a CSV, XLSX e ODS. " +
      "Sem conta especial, sem plugin, sem configuração de schema — só o arquivo.",
  },
  {
    number: "02",
    title: "Os gráficos aparecem automaticamente",
    description:
      "A engine detecta o tipo de cada coluna — numérica, categórica, data — e escolhe " +
      "até 4 gráficos relevantes para aquele conjunto de dados.",
  },
  {
    number: "03",
    title: "Peça uma análise à IA",
    description:
      "Com sua API Key configurada, o sistema envia uma amostra para o modelo de sua escolha " +
      "e devolve os insights em texto na mesma tela. OpenAI, Claude, Gemini ou Groq.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="py-20 border-t"
      data-testid="how-it-works-section"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-12">
          Como o PlanilhaDash funciona
        </h2>

        <div className="space-y-12">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="grid grid-cols-[4rem_1fr] gap-6 items-start"
            >
              <span
                className="text-5xl font-bold text-muted-foreground/20 leading-none select-none"
                aria-hidden="true"
              >
                {step.number}
              </span>
              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  {step.title}
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
