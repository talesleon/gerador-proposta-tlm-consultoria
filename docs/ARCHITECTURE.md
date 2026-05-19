# Arquitetura técnica

## Visão geral

Aplicação full-stack rodando em **edge runtime (Cloudflare Workers)** com
SSR via **TanStack Start v1**, frontend em **React 19 + Tailwind v4** e
backend em **Supabase (Postgres + Auth + Storage)** servido pelo **Lovable
Cloud**.

```text
Browser ──► TanStack Router ──► createServerFn (RPC tipado)
                                      │
                                      ▼
                          Cloudflare Worker (SSR + handlers)
                                      │
                                      ▼
                              Supabase (Postgres + Auth)
```

## Decisões-chave (ADRs resumidas)

### ADR-001 — TanStack Start em vez de Next.js
**Contexto:** precisamos de SSR, file-based routing e tipagem ponta-a-ponta.
**Decisão:** TanStack Start v1.
**Consequências:** tipagem superior nas rotas e em `createServerFn`; menos
adoção do mercado que Next; documentação ainda em evolução.

### ADR-002 — Cloudflare Workers como runtime
**Contexto:** latência global baixa e custo previsível.
**Decisão:** Workers via `@cloudflare/vite-plugin` com `nodejs_compat`.
**Consequências:** restrições de runtime (sem `child_process`, `sharp`,
etc.); ganho de cold-start ≈ 0 ms.

### ADR-003 — Supabase via Lovable Cloud
**Contexto:** precisamos de auth + DB + RLS sem operar infra.
**Decisão:** Lovable Cloud (Supabase gerenciado).
**Consequências:** migrations versionadas em `supabase/migrations`;
service role isolada em `client.server.ts`.

### ADR-004 — Roles em tabela separada
**Contexto:** colocar `role` na tabela `profiles` permite que um usuário
edite seu próprio papel via RLS de UPDATE.
**Decisão:** tabela `user_roles` + função `has_role()` SECURITY DEFINER.
**Consequências:** zero risco de privilege escalation; queries de role
levam um JOIN extra (insignificante).

### ADR-005 — Server functions para lógica privilegiada
**Contexto:** o cliente nunca pode tocar a service-role key.
**Decisão:** toda chamada admin passa por `createServerFn` com
middleware `requireSupabaseAuth` + `assertAdmin`.
**Consequências:** auditável via logs de Worker; bundle do cliente
permanece pequeno.

## Camadas

### 1. Apresentação (`src/routes`, `src/components`)

- File-based routing (TanStack Router): `_authenticated.tsx` é layout-gate
  que redireciona para `/login` se não houver sessão.
- shadcn/ui sobre Radix; design tokens em `src/styles.css` (oklch).
- Forms com `react-hook-form` + `zod` (cadastro/login/admin).

### 2. Domínio (`src/lib`)

- `proposal.ts` — funções puras de cálculo (testáveis sem DOM).
- `pdf.ts` — geração de PDF com jsPDF.
- `storage.ts` — CRUD de propostas no Supabase via client browser.

### 3. Aplicação (server) — `src/lib/*.functions.ts`

- `admin.functions.ts` — `listConsultores`, `createConsultor`,
  `deleteConsultor`, `setSuspended`, `setAdminRole`, `resetUserPassword`.
- Cada função:
  1. Aplica `requireSupabaseAuth` (Bearer JWT do usuário).
  2. Chama `assertAdmin(userId)` que consulta `user_roles` via
     `supabaseAdmin`.
  3. Executa a operação com service role.

### 4. Infra (`src/integrations/supabase`)

| Cliente | Uso | Chave |
| --- | --- | --- |
| `client.ts` | Browser (auth, queries com RLS do usuário) | publishable |
| `client.server.ts` | Server (admin, bypass RLS) | service_role |
| `auth-middleware.ts` | Validação de Bearer JWT em server fns | publishable |
| `auth-attacher.ts` | Anexa `Authorization` em todas as RPC do cliente | — |

## Fluxo de autenticação

```text
Browser                          Worker                       Supabase
  │  POST /signup → supabase.auth.signUp(email, pwd)            │
  ├────────────────────────────────────────────────────────────►│
  │◄──────────────────────── access_token (JWT) ────────────────┤
  │                                                              │
  │  Render /                                                    │
  │  useAuth() armazena session em estado                        │
  │                                                              │
  │  Ação admin → useServerFn(createConsultor)                   │
  │  attachSupabaseAuth injeta Bearer JWT                        │
  ├──────────────────────►│                                      │
  │                       │ requireSupabaseAuth valida JWT       │
  │                       │ assertAdmin → has_role(uid,'admin')  │
  │                       ├─────────────────────────────────────►│
  │                       │◄───────────── true ──────────────────┤
  │                       │ supabaseAdmin.auth.admin.createUser  │
  │                       ├─────────────────────────────────────►│
  │◄──────────────────────┤◄────────── user criado ──────────────┤
```

## Segurança

- **RLS habilitada em todas as tabelas públicas** (`profiles`, `user_roles`).
- Policies escritas em `supabase/migrations/*.sql`; revisar em PR.
- Nunca importar `client.server.ts` em arquivos do bundle cliente.
- Secrets em `process.env.*` (server) — nunca em `VITE_*` quando sensível.

## Observabilidade

- Logs de server functions disponíveis no Lovable Cloud.
- Console do Worker captura erros não tratados → sentry-like UI no Lovable.

## Testes (planejado)

| Camada | Ferramenta | Status |
| --- | --- | --- |
| Unitário (`proposal.ts`) | Vitest | a fazer |
| Integração (server fns) | Vitest + Supabase local | a fazer |
| E2E | Playwright | a fazer |
