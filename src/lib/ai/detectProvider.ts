export type SupportedProvider = "openai" | "anthropic" | "google" | "groq";

const PROVIDER_HINTS: [string, SupportedProvider][] = [
  ["AIza", "google"],
  ["sk-ant-", "anthropic"],
  ["sk-", "openai"],
  ["gsk_", "groq"],
];

const PROVIDER_LABELS: Record<SupportedProvider, string> = {
  google: "Google Gemini",
  anthropic: "Anthropic Claude",
  openai: "OpenAI",
  groq: "Groq",
};

const PROVIDER_LINKS: Record<SupportedProvider, string> = {
  google: "aistudio.google.com/apikey",
  anthropic: "console.anthropic.com",
  openai: "platform.openai.com/api-keys",
  groq: "console.groq.com/keys",
};

/**
 * Detects the AI provider from the API key prefix.
 * Falls back to "openai" for keys with unrecognized format
 * (compatible with any OpenAI-spec endpoint).
 */
export function detectProvider(apiKey: string): SupportedProvider {
  const key = apiKey.trim();
  for (const [prefix, provider] of PROVIDER_HINTS) {
    if (key.startsWith(prefix)) return provider;
  }
  return "openai";
}

export function getProviderLabel(provider: SupportedProvider): string {
  return PROVIDER_LABELS[provider];
}

export function getProviderLink(provider: SupportedProvider): string {
  return PROVIDER_LINKS[provider];
}
