# Skill: Refactor

**Projeto:** PlanilhaDash
**Uso:** Guia para refatorações seguras sem quebrar funcionalidade.

---

## Princípios

1. **Não refatorar o que não foi lido** — ler o arquivo completo antes de qualquer mudança
2. **Mudança mínima** — alterar apenas o que é necessário para o objetivo da refatoração
3. **Não mudar comportamento** — refatoração não muda o que o código faz, apenas como faz
4. **Um objetivo por PR** — não misturar refatoração com novas features ou bug fixes

---

## Ordem segura de refatoração

```
1. Ler o arquivo completo
2. Identificar o escopo exato da mudança
3. Verificar se há testes cobrindo o código a refatorar
4. Fazer a mudança menor possível
5. Verificar se lint passa: npm run lint
6. Testar manualmente o fluxo afetado
7. Commitar com prefixo refactor:
```

---

## O que extrair para `src/lib/`

Extrair lógica para lib quando:
- A mesma lógica aparece em 2+ lugares
- A função tem > 30 linhas e pode ser nomeada com clareza
- A lógica é testável independentemente do componente

```
src/lib/
├── auth/       ← lógica de autenticação
├── crypto/     ← criptografia (apiKey)
├── db/         ← schema + client Drizzle
├── ai/         ← análise multi-provider
├── parser/     ← parsing de planilhas
├── inferTypes  ← heurísticas de tipo
├── chartEngine ← seleção de gráficos
└── pdfExport   ← export PDF
```

---

## O que NÃO extrair

- Não criar abstração para lógica usada em apenas 1 lugar
- Não criar `utils.ts` genérico — nomear utilitários pelo domínio (`authUtils.ts`, `reportUtils.ts`)
- Não criar HOCs ou wrappers desnecessários ao redor de componentes shadcn/ui

---

## Refatoração de componentes

```tsx
// ❌ Componente fazendo tudo
export function UploadPage() {
  // 200 linhas de lógica misturada com JSX
}

// ✅ Separar responsabilidades
export function UploadPage() {
  return <Dropzone onFile={handleFile} />;
}

// Lógica de parsing em hook separado
function useFileParser() {
  const [rows, setRows] = useState([]);
  async function handleFile(file: File) {
    const parsed = await parseFile(file);
    setRows(parsed);
  }
  return { rows, handleFile };
}
```

---

## Proibições durante refatoração

- Nunca renomear funções/types exportados sem buscar todos os usos (usar Grep antes)
- Nunca mover arquivos de `src/lib/` sem atualizar todos os imports
- Nunca simplificar a lógica de `encryptApiKey` / `decryptApiKey` — segurança crítica
- Nunca remover validação Zod de API Routes como "simplificação"
- Nunca substituir `bcrypt` por alternativa "mais simples" — custo mínimo 12 é requisito de segurança
