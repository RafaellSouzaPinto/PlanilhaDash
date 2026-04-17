# Como contribuir

## Pré-requisitos

- Node.js >= 20
- MariaDB 10.11
- npm

## Rodando localmente

1. Fork e clone o repositório
2. `npm install`
3. `cp .env.example .env.local`
4. Gere as chaves obrigatórias (veja o README)
5. `npm run db:push`
6. `npm run dev`

## Padrões do projeto

- Commits em português ou inglês
- Uma feature por PR
- Sem `any` no TypeScript — use `unknown` com type guards
- Validação de inputs com Zod nas rotas de API
- Rode `npm run lint` antes de abrir PR

## Testes

```bash
npm run test        # roda todos os testes
npm run test:watch  # modo watch
```

## Issues

Olhe as issues com label `good first issue` para começar.
Issues com `help wanted` são as que mais precisam de ajuda.

## Abrindo um Pull Request

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona feature X'`)
4. Push pra branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request descrevendo o que mudou e por quê
