# Decisões Técnicas e Correções — PlanilhaDash

> Registro de decisões arquiteturais e correções já aplicadas.
> Adicionar novas entradas no topo, com data e motivo.

---

## [2026-04-08] Estrutura inicial de documentação

**Decisão:** Separar `README.md` (documentação pública para GitHub/contribuidores) de `CLAUDE.md` (instrução de comportamento para a IA).

**Motivo:** README.md é voltado para humanos que chegam ao repositório. CLAUDE.md é lido automaticamente pelo Claude Code e contém regras críticas, credenciais de dev e skills. São públicos diferentes com necessidades diferentes.

**Impacto:** CLAUDE.md na raiz é lido automaticamente em toda sessão do Claude Code. Atualizar CLAUDE.md ao mudar stack, regras ou banco.

---

## [2026-04-08] AES-256-GCM para API Keys

**Decisão:** Criptografar API Keys de IA com AES-256-GCM em vez de apenas hash.

**Motivo:** Keys precisam ser decriptografadas para uso. Hash seria irreversível. AES-256-GCM provê confidencialidade + autenticidade (tag de autenticação garante que o ciphertext não foi adulterado).

**Impacto:** `ENCRYPTION_KEY` (32 bytes hex) é obrigatória em produção. Perder essa chave torna todas as API Keys dos usuários irrecuperáveis.

---

## [2026-04-08] Lucia Auth v3 com sessões no banco

**Decisão:** Usar Lucia Auth v3 com sessões em MariaDB (via adapter Drizzle) em vez de JWT stateless.

**Motivo:** Sessões no banco permitem invalidação imediata (logout real). JWTs stateless não podem ser revogados antes do TTL expirar — risco de segurança se o token vazar.

**Impacto:** Tabela `sessions` cresce com o uso. Em produção, implementar limpeza periódica de sessões expiradas.

---

## [2026-04-08] Parsing client-side (SheetJS/PapaParse no browser)

**Decisão:** Parser roda no browser, não no servidor.

**Motivo:** Evita upload do arquivo raw para o servidor apenas para parsing. Reduz carga e latência. Apenas metadados e amostra (50 linhas) são enviados para a API de IA.

**Impacto:** Limite de tamanho (10MB) é validado no cliente antes do upload. Arquivo físico ainda é enviado ao servidor para armazenamento em `uploads/`.

---

*Adicionar novas entradas aqui conforme decisões forem tomadas.*
