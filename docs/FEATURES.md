# FEATURES.md — PlanilhaDash

> Visão geral de todas as features com status. Para detalhes de implementação, ver [runbooks/features.md](runbooks/features.md).

## Legenda de Status

| Símbolo | Significado |
|---------|-------------|
| ✅ | Implementado |
| 🚧 | Em desenvolvimento |
| 📋 | Planejado (backlog priorizado) |
| 💡 | Ideia / backlog sem data |

---

## MVP — v0.1

**Objetivo:** Sistema funcional de ponta a ponta com auth, upload, dashboard, IA e histórico.

### M01 — Autenticação

| Feature | Status | Módulo |
|---------|--------|--------|
| Cadastro (name, email, senha) | ✅ | [M01_AUTH.md](modulos/M01_AUTH.md) |
| Login com sessão persistida | ✅ | [M01_AUTH.md](modulos/M01_AUTH.md) |
| Logout (invalida sessão no banco) | ✅ | [M01_AUTH.md](modulos/M01_AUTH.md) |
| Middleware de proteção de rotas | ✅ | [M01_AUTH.md](modulos/M01_AUTH.md) |

### M02 — Configuração de IA

| Feature | Status | Módulo |
|---------|--------|--------|
| Modal de configuração na primeira sessão | ✅ | [M02_UPLOAD_PARSER.md](modulos/M02_UPLOAD_PARSER.md) |
| Detecção automática de provider pelo prefixo da key | ✅ | [M02_UPLOAD_PARSER.md](modulos/M02_UPLOAD_PARSER.md) |
| Salvar API Key criptografada (AES-256-GCM) | ✅ | [M02_UPLOAD_PARSER.md](modulos/M02_UPLOAD_PARSER.md) |
| Ignorar configuração (usar sem IA) | ✅ | [M02_UPLOAD_PARSER.md](modulos/M02_UPLOAD_PARSER.md) |
| Atualizar key a qualquer momento (settings) | ✅ | [M02_UPLOAD_PARSER.md](modulos/M02_UPLOAD_PARSER.md) |

### M03 — Upload e Parsing

| Feature | Status | Módulo |
|---------|--------|--------|
| Upload de CSV | ✅ | [M02_UPLOAD_PARSER.md](modulos/M02_UPLOAD_PARSER.md) |
| Upload de XLSX | ✅ | [M02_UPLOAD_PARSER.md](modulos/M02_UPLOAD_PARSER.md) |
| Upload de ODS | ✅ | [M02_UPLOAD_PARSER.md](modulos/M02_UPLOAD_PARSER.md) |
| Dropzone drag-and-drop | ✅ | [M02_UPLOAD_PARSER.md](modulos/M02_UPLOAD_PARSER.md) |
| Validação de tipo e tamanho (máx 10MB) | ✅ | [M02_UPLOAD_PARSER.md](modulos/M02_UPLOAD_PARSER.md) |
| Inferência automática de tipos de colunas | ✅ | [M02_UPLOAD_PARSER.md](modulos/M02_UPLOAD_PARSER.md) |

### M04 — Dashboard e Gráficos

| Feature | Status | Módulo |
|---------|--------|--------|
| Dashboard automático (até 4 gráficos) | ✅ | [M03_CHART_ENGINE.md](modulos/M03_CHART_ENGINE.md) |
| Gráfico de barras (categórico × numérico) | ✅ | [M03_CHART_ENGINE.md](modulos/M03_CHART_ENGINE.md) |
| Gráfico de linha (temporal × numérico) | ✅ | [M03_CHART_ENGINE.md](modulos/M03_CHART_ENGINE.md) |
| Gráfico de pizza (categórico ≤ 8 valores) | ✅ | [M03_CHART_ENGINE.md](modulos/M03_CHART_ENGINE.md) |
| Gráfico de barras horizontais (percentual × categórico) | ✅ | [M03_CHART_ENGINE.md](modulos/M03_CHART_ENGINE.md) |
| Tabela de dados (fallback) | ✅ | [M03_CHART_ENGINE.md](modulos/M03_CHART_ENGINE.md) |

### M05 — Análise de IA

| Feature | Status | Módulo |
|---------|--------|--------|
| Análise com OpenAI (gpt-4o-mini) | ✅ | [M04_AI.md](modulos/M04_AI.md) |
| Análise com Anthropic (claude-3-haiku-20240307) | ✅ | [M04_AI.md](modulos/M04_AI.md) |
| Análise com Google (gemini-2.5-flash) | ✅ | [M04_AI.md](modulos/M04_AI.md) |
| Análise com Groq (llama-3.1-8b-instant) | ✅ | [M04_AI.md](modulos/M04_AI.md) |
| Dashboard funcional sem IA | ✅ | [M04_AI.md](modulos/M04_AI.md) |

### M06 — Histórico e Persistência

| Feature | Status | Módulo |
|---------|--------|--------|
| Salvar relatório após geração | ✅ | [M06_HISTORICO.md](modulos/M06_HISTORICO.md) |
| Listar relatórios do usuário | ✅ | [M06_HISTORICO.md](modulos/M06_HISTORICO.md) |
| Visualizar relatório salvo | ✅ | [M06_HISTORICO.md](modulos/M06_HISTORICO.md) |

### M07 — Exportação PDF

| Feature | Status | Módulo |
|---------|--------|--------|
| Exportar dashboard completo como PDF | ✅ | [M06_PDF.md](modulos/M06_PDF.md) |

### M08 — Landing Page

| Feature | Status | Módulo |
|---------|--------|--------|
| Landing page pública upload-first | ✅ | [M07_LANDING_PAGE_V3.md](modulos/M07_LANDING_PAGE_V3.md) |
| Trial sem login (localStorage gate) | ✅ | [M07_LANDING_PAGE_V3.md](modulos/M07_LANDING_PAGE_V3.md) |
| Navbar minimalista (logo + "Entrar") | ✅ | [M07_LANDING_PAGE_V3.md](modulos/M07_LANDING_PAGE_V3.md) |
| Banner de conversão pós-upload | ✅ | [M07_LANDING_PAGE_V3.md](modulos/M07_LANDING_PAGE_V3.md) |

---

## v0.2 — Novos formatos e interatividade

| Feature | Status | Descrição |
|---------|--------|-----------|
| Suporte a `.ods` | ✅ | OpenDocument Spreadsheet via SheetJS (incluído no M03) |
| Gráfico de barras horizontais | ✅ | Para percentuais e rankings (incluído no M04) |
| Gráfico de dispersão | 📋 | Dois campos numéricos |
| Cards KPI | 📋 | Total, média, máx, mín por coluna numérica |
| Filtros interativos | 📋 | Filtrar por coluna categórica no dashboard |
| Múltiplas sheets | 📋 | Seletor de aba do XLSX |

---

## v0.3 — Customização

| Feature | Status | Descrição |
|---------|--------|-----------|
| Seleção manual de tipo de gráfico | 📋 | Trocar o gráfico gerado automaticamente |
| Paleta de cores customizável | 📋 | Escolher esquema de cores |
| Título e descrição do dashboard | 📋 | Nomear antes de salvar |
| Temas (claro/escuro/corporativo) | 📋 | Aparência do dashboard |
| Preview de impressão | 📋 | Ver layout do PDF antes de baixar |

---

## v0.4 — Compartilhamento

| Feature | Status | Descrição |
|---------|--------|-----------|
| Link de compartilhamento | 📋 | URL pública temporária (TTL: 7 dias) |
| Deletar relatório | 📋 | Remover do histórico |
| Renomear relatório | 📋 | Dar nome amigável |

---

## Backlog / Ideias futuras

| Feature | Prioridade | Descrição |
|---------|-----------|-----------|
| Conector Google Sheets | Alta | Importar via URL pública |
| Exportar para Excel | Média | Dashboard + dados em XLSX |
| Comparar dois relatórios | Média | Métricas lado a lado |
| Notificação por email | Baixa | Enviar PDF após geração |
| API pública REST | Baixa | Integração com outros sistemas |
| Multi-idioma (i18n) | Baixa | EN, ES, PT-BR |
| Organizar relatórios em pastas | Baixa | Estrutura de diretórios no histórico |

---

## Critérios de Aceitação do MVP (v0.1)

- [x] Cadastro e login funcionando — sessão persiste após fechar e reabrir o browser
- [x] Modal de API Key aparece na primeira sessão, não nas seguintes
- [x] API Key salva no banco **não está em plaintext** (verificar via `SELECT ai_api_key FROM users`)
- [x] Upload de CSV com até 10MB processa sem travar o browser
- [x] Dashboard exibe ao menos 2 gráficos distintos para planilhas com 3+ colunas mistas
- [x] Análise de IA funciona com OpenAI, Claude e Gemini (testar individualmente)
- [x] Relatório aparece no histórico após geração
- [x] Relatório salvo pode ser reaberto com o mesmo dashboard
- [x] PDF baixado contém todos os gráficos em tamanho legível
- [x] Logout invalida sessão e redireciona para `/login`
- [x] Rota protegida sem sessão redireciona para `/login`
