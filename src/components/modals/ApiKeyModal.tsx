"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { KeyRound } from "lucide-react";
import {
  detectProvider,
  getProviderLabel,
  getProviderLink,
  type SupportedProvider,
} from "@/lib/ai/detectProvider";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function ApiKeyModal({ open, onOpenChange, onSaved }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const detectedProvider: SupportedProvider | null = apiKey.trim()
    ? detectProvider(apiKey.trim())
    : null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Configurar API Key de IA
          </DialogTitle>
          <DialogDescription>
            Sua chave é criptografada com AES-256 antes de ser salva.
            Nunca é armazenada em texto simples.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="apiKey">API Key</Label>
              {detectedProvider && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {getProviderLabel(detectedProvider)}
                </Badge>
              )}
            </div>
            <Input
              id="apiKey"
              type="password"
              placeholder="Cole sua chave aqui (AIzaSy..., sk-..., sk-ant-..., gsk_...)"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setError(""); }}
              autoComplete="off"
            />
            {detectedProvider && (
              <p className="text-xs text-muted-foreground">
                Obtenha sua chave em:{" "}
                <a
                  href={`https://${getProviderLink(detectedProvider)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  {getProviderLink(detectedProvider)}
                </a>
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => { onOpenChange(false); setError(""); setApiKey(""); }}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !apiKey.trim()}>
            {loading ? "Salvando..." : "Salvar chave"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
