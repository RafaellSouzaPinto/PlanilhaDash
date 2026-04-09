import { describe, it, expect, beforeAll } from "vitest";

// Set up a test encryption key before importing the module
beforeAll(() => {
  process.env.ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("encryptApiKey / decryptApiKey", () => {
  it("decripta para o mesmo plaintext original (round-trip)", async () => {
    const { encryptApiKey, decryptApiKey } = await import(
      "@/lib/crypto/apiKey"
    );
    const original = "sk-test-1234567890abcdef";
    const encrypted = encryptApiKey(original);
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(original);
  });

  it("gera ciphertexts diferentes a cada chamada (IV aleatório)", async () => {
    const { encryptApiKey } = await import("@/lib/crypto/apiKey");
    const key = "sk-same-key";
    const enc1 = encryptApiKey(key);
    const enc2 = encryptApiKey(key);
    expect(enc1).not.toBe(enc2);
  });

  it("formato é iv:tag:ciphertext (3 partes separadas por :)", async () => {
    const { encryptApiKey } = await import("@/lib/crypto/apiKey");
    const encrypted = encryptApiKey("test-key");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    // Each part should be non-empty hex
    for (const part of parts) {
      expect(part.length).toBeGreaterThan(0);
      expect(/^[0-9a-f]+$/.test(part)).toBe(true);
    }
  });

  it("chave vazia também é criptografada/decriptada corretamente", async () => {
    const { encryptApiKey, decryptApiKey } = await import(
      "@/lib/crypto/apiKey"
    );
    const original = "";
    const encrypted = encryptApiKey(original);
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(original);
  });

  it("chave com caracteres especiais funciona", async () => {
    const { encryptApiKey, decryptApiKey } = await import(
      "@/lib/crypto/apiKey"
    );
    const original = "AIzaSy!@#$%^&*()_+-=test-key-with-special-chars";
    const encrypted = encryptApiKey(original);
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(original);
  });
});
