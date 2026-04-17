"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  KeyRound,
  ExternalLink,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import {
  detectProvider,
  type SupportedProvider,
} from "@/lib/ai/detectProvider";

type ProviderCard = {
  id: SupportedProvider;
  name: string;
  model: string;
  costNote: string;
  keyLink: string;
  keyFormat: string;
};

const PROVIDERS: ProviderCard[] = [
  {
    id: "openai",
    name: "OpenAI",
    model: "GPT-4o mini",
    costNote: "~$0,001 / análise",
    keyLink: "https://platform.openai.com/api-keys",
    keyFormat: "sk-...",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    model: "Claude Haiku",
    costNote: "~$0,001 / análise",
    keyLink: "https://console.anthropic.com",
    keyFormat: "sk-ant-...",
  },
  {
    id: "google",
    name: "Google Gemini",
    model: "Gemini 2.5 Flash",
    costNote: "Gratuito no tier inicial",
    keyLink: "https://aistudio.google.com/apikey",
    keyFormat: "AIzaSy...",
  },
  {
    id: "groq",
    name: "Groq",
    model: "Llama 3.1 8B",
    costNote: "Gratuito no tier inicial",
    keyLink: "https://console.groq.com/keys",
    keyFormat: "gsk_...",
  },
];

type FreeTierInfo = {
  used: number;
  limit: number;
  hasFreeTierAvailable: boolean;
};

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function ApiKeyModal({ open, onOpenChange, onSaved }: ApiKeyModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedProvider, setSelectedProvider] =
    useState<SupportedProvider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [freeTierInfo, setFreeTierInfo] = useState<FreeTierInfo | null>(null);

  const detectedProvider: SupportedProvider | null = apiKey.trim()
    ? detectProvider(apiKey.trim())
    : null;

  const activeProviderId: SupportedProvider =
    detectedProvider ?? selectedProvider ?? "openai";
  const activeProvider =
    PROVIDERS.find((p) => p.id === activeProviderId) ?? PROVIDERS[0];

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelectedProvider(null);
    setApiKey("");
    setError("");
    fetch("/api/user/ai-status")
      .then((r) => r.json())
      .then((data) =>
        setFreeTierInfo({
          used: data.freeTierUsed ?? 0,
          limit: data.freeTierLimit ?? 3,
          hasFreeTierAvailable: data.hasFreeTierAvailable ?? false,
        })
      )
      .catch(() => {});
  }, [open]);

  async function handleSave() {
    if (!apiKey.trim()) {
      setError("Informe a chave de API");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/user/api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Erro ao salvar chave");
        return;
      }
      setApiKey("");
      onOpenChange(false);
      onSaved?.();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const remainingAnalyses = freeTierInfo
    ? freeTierInfo.limit - freeTierInfo.used
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {step === 1 ? "Configure sua IA" : "Cole sua API Key"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Cada análise consome poucos centavos de API. Escolha um provedor."
              : `Gere a chave em ${activeProvider.keyLink.replace("https://", "")} e cole abaixo.`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            {freeTierInfo && (
              <div
                className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${
                  freeTierInfo.hasFreeTierAvailable
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
                }`}
              >
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {freeTierInfo.hasFreeTierAvailable
                    ? `Você ainda tem ${remainingAnalyses} análise${remainingAnalyses !== 1 ? "s" : ""} gratuita${remainingAnalyses !== 1 ? "s" : ""} disponível${remainingAnalyses !== 1 ? "is" : ""}.`
                    : `Suas ${freeTierInfo.limit} análises gratuitas foram utilizadas. Configure uma chave para continuar.`}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProvider(p.id)}
                  className={`rounded-lg border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                    selectedProvider === p.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {p.model}
                  </div>
                  <div className="mt-1.5 text-xs font-medium text-primary">
                    {p.costNote}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedProvider}
                className="gap-1.5"
              >
                Continuar
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <a
              href={activeProvider.keyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm transition-colors hover:bg-accent"
            >
              <span>
                Gerar chave em{" "}
                <span className="font-medium">{activeProvider.name}</span>
                <br />
                <span className="text-xs text-muted-foreground">
                  {activeProvider.keyLink.replace("https://", "")}
                </span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="apiKey">Cole a chave aqui</Label>
                {(detectedProvider || selectedProvider) && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {activeProvider.name}
                  </Badge>
                )}
              </div>
              <Input
                id="apiKey"
                type="password"
                placeholder={activeProvider.keyFormat}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError("");
                }}
                autoComplete="off"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Custo estimado:{" "}
                <span className="font-medium text-foreground">
                  {activeProvider.costNote}
                </span>
                {" · "}
                Criptografada com AES-256 antes de ser salva.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep(1);
                  setError("");
                }}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || !apiKey.trim()}
              >
                {loading ? "Salvando..." : "Salvar chave"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
