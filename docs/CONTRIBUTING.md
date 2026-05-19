# Guia de contribuição

Obrigado por considerar contribuir! Este projeto faz parte de um portfólio,
então PRs e issues são muito bem-vindas.

## Setup

```bash
bun install
bun run dev
```

Pré-requisitos:

- Bun ≥ 1.1
- Conta Supabase (ou Lovable Cloud) com as migrations aplicadas
- `.env` populado (ver [README](../README.md#como-rodar-localmente))

## Fluxo

1. Abra uma issue descrevendo o bug/feature antes de codar.
2. Crie uma branch a partir de `main`: `feat/nome-curto` ou `fix/nome-curto`.
3. Faça commits pequenos e descritivos (Conventional Commits).
4. Rode `bun run lint` antes de abrir o PR.
5. Descreva no PR **o quê** mudou e **por quê** — não só o como.

## Padrões de código

- **TypeScript strict** — sem `any` sem justificativa.
- **Componentes** pequenos e focados; lógica pura em `src/lib/`.
- **Cores e espaçamentos** sempre via tokens (`src/styles.css`), nunca
  classes hard-coded como `bg-white`.
- **Server-side** — qualquer operação privilegiada vai em
  `createServerFn` com `requireSupabaseAuth`.
- **Migrations** — uma migration por mudança de schema; nunca editar
  migrations já mergeadas.

## Segurança

- Nunca commitar `.env` ou chaves.
- Nunca importar `client.server.ts` em arquivos que vão para o bundle do
  cliente.
- Toda nova tabela deve nascer com RLS habilitada e policies explícitas.

## Convenção de commits

```text
feat: adiciona dropdown SAC/PRICE no editor
fix: corrige cálculo de V.F quando V.A é zero
docs: atualiza PRD com KPIs de 2026
chore: bump tailwind para 4.3
refactor: extrai seguroEvolucao para módulo próprio
```
