const SECONDARY_FEATURES = [
  "Exportação PDF com um clique",
  "Até 4 gráficos por dashboard",
  "Barra, pizza, linha e área",
  "Criptografia AES-256-GCM",
  "OpenAI, Claude, Gemini e Groq",
  "Histórico de relatórios",
] as const;

function Divider() {
  return <hr className="border-border" />;
}

function UploadMockup() {
  return (
    <div
      className="rounded-lg border bg-background p-4 text-sm space-y-2"
      data-testid="upload-mockup"
    >
      <div className="rounded border border-dashed p-4 text-center bg-muted/30">
        <p className="font-medium text-foreground text-xs">vendas-2024.xlsx</p>
        <p className="text-muted-foreground text-xs mt-0.5">2,4 MB · pronto</p>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
        <span>8 colunas detectadas</span>
        <span>1.240 linhas</span>
      </div>
    </div>
  );
}

const PROVIDERS = ["OpenAI", "Claude", "Gemini", "Groq"] as const;

function AiMockup() {
  return (
    <div
      className="rounded-lg border bg-background p-5 space-y-4"
      data-testid="ai-mockup"
    >
      {/* Seleção de provider */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Provedor de IA</p>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p, i) => (
            <span
              key={p}
              className={`text-xs rounded-md border px-3 py-1.5 ${
                i === 1
                  ? "bg-foreground text-background border-foreground font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Campo de API Key */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">API Key</p>
        <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
          <span className="text-xs font-mono text-muted-foreground tracking-widest">
            sk-ant-••••••••••••••••••••
          </span>
        </div>
      </div>

      {/* Botão de ação */}
      <div className="pt-1">
        <div className="w-full rounded-md bg-foreground text-background text-xs font-medium text-center py-2">
          Analisar planilha
        </div>
      </div>
    </div>
  );
}

function HistoryMockup() {
  const items = [
    { name: "vendas-q4-2024.xlsx", date: "há 2 dias" },
    { name: "clientes-novembro.csv", date: "há 1 semana" },
    { name: "estoque-outubro.ods", date: "há 3 semanas" },
  ] as const;

  return (
    <div
      className="rounded-lg border bg-background divide-y text-sm"
      data-testid="history-mockup"
    >
      {items.map(({ name, date }) => (
        <div key={name} className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-medium text-foreground truncate max-w-[160px]">
            {name}
          </span>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">{date}</span>
        </div>
      ))}
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="py-20 border-t" data-testid="features-section">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* Feature 1 — Upload */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
              Upload
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Jogue o arquivo. O resto é por nossa conta.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              CSV, XLSX ou ODS — o PlanilhaDash lê o arquivo, detecta o tipo de cada coluna
              e já monta os gráficos mais adequados. Sem formulários de mapeamento,
              sem escolher qual coluna vai em qual eixo.
            </p>
          </div>
          <UploadMockup />
        </div>

        <Divider />

        {/* Feature 2 — IA */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <AiMockup />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
              Análise com IA
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Sua chave. Seu modelo. Seus dados.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Conecte sua própria API Key de OpenAI, Claude, Gemini ou Groq.
              O PlanilhaDash envia uma amostra dos dados e devolve uma análise
              em linguagem natural — sem intermediários e sem armazenar sua chave em texto puro.
            </p>
          </div>
        </div>

        <Divider />

        {/* Feature 3 — Histórico */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
              Histórico
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Todo relatório salvo, acessível na hora.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Cada upload gera um relatório com gráficos e insights que ficam salvos na sua conta.
              Acesse qualquer um deles, exporte em PDF ou compartilhe o link — quando quiser.
            </p>
          </div>
          <HistoryMockup />
        </div>

        <Divider />

        {/* Features secundárias */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
            Também inclui
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {SECONDARY_FEATURES.map((feature) => (
              <span key={feature} className="text-sm text-muted-foreground">
                {feature}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
