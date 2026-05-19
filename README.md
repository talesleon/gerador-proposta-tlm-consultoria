# Gerador de Propostas Imobiliárias — TLM

> Plataforma white-label para consultores imobiliários gerarem, salvarem e
> compartilharem propostas comerciais de unidades MCMV (Riva / Direcional) em
> segundos — com cálculo automático de financiamento, evolução do seguro de
> obra, exportação em PDF e mensagem pronta para WhatsApp.

![Stack](https://img.shields.io/badge/stack-TanStack_Start_%2B_React_19-blue)
![Backend](https://img.shields.io/badge/backend-Supabase-3ecf8e)
![Runtime](https://img.shields.io/badge/runtime-Cloudflare_Workers-f38020)
![Status](https://img.shields.io/badge/status-MVP-success)

---

## Sumário

- [Sobre o produto](#sobre-o-produto)
- [Demonstração](#demonstração)
- [Principais funcionalidades](#principais-funcionalidades)
- [Stack técnica](#stack-técnica)
- [Arquitetura](#arquitetura)
- [Modelo de dados](#modelo-de-dados)
- [Regras de negócio](#regras-de-negócio)
- [Como rodar localmente](#como-rodar-localmente)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Roadmap](#roadmap)
- [Documentação adicional](#documentação-adicional)

---

## Sobre o produto

Consultores imobiliários do segmento econômico (Riva, Direcional) precisam
montar propostas comerciais personalizadas para cada cliente, recalculando
manualmente sinal, pró-soluto, seguro de obra e parcela pós-chaves. O processo
hoje é feito em planilhas + cópia/colagem no WhatsApp, sujeito a erros de
cálculo e perda de oportunidades.

Este produto transforma esse fluxo em **uma única tela**: o consultor preenche
os valores, vê o cálculo em tempo real e exporta um PDF profissional ou um
texto formatado para enviar direto pelo WhatsApp do cliente.

### Persona-alvo

- **Consultor imobiliário independente** ou ligado a uma imobiliária parceira,
  que atende leads via WhatsApp e precisa responder com agilidade.
- **Administrador da imobiliária** (ex.: TLM Negócios Imobiliários), que
  gerencia o acesso da equipe e mantém a marca padronizada.

### Proposta de valor

| Antes | Depois |
| --- | --- |
| Planilha Excel + cópia manual | Formulário web com cálculo instantâneo |
| Texto WhatsApp formatado à mão | Botão "Copiar para WhatsApp" pronto |
| Sem histórico de propostas enviadas | CRUD de propostas por consultor |
| Sem controle de quem usa | Dashboard admin com suspensão/exclusão |

---

## Demonstração

| Tela | Descrição |
| --- | --- |
| `/login`, `/signup` | Autenticação via e-mail + senha (Supabase Auth). |
| `/` (autenticado) | Editor de proposta com cálculo ao vivo, salvamento e exportação PDF/WhatsApp. |
| `/minha-conta` | Perfil do consultor (nome, CRECI, telefone, cores e logo da marca). |
| `/admin` | Painel restrito a admins: criar, suspender, excluir e promover usuários. |

---

## Principais funcionalidades

### Para o consultor

- **Cálculo em tempo real** de Valor Financiável (V.F), Valor de Entrada (V.E),
  Sinal (S.A), Entrada Complementar (E.C) e Pró-soluto (P.S) conforme o cliente
  digita.
- **Sistema de financiamento** SAC (90% do V.A) ou PRICE (80% do V.A),
  selecionável por proposta.
- **Limites por construtora** — Riva (até 48x pró-soluto) e Direcional
  (até 84x), com validação visual.
- **Correção contratual do pró-soluto** — 0,5% a.m. até a 36ª parcela e
  1,5% a.m. da 37ª à 84ª, com média corrigida exibida.
- **Evolução do seguro de obra** com curva exponencial leve (k=1.6) e
  visualização em sparkline ASCII no texto do WhatsApp.
- **Composição da entrada** com parcela estimada (≈ R$ X/mês) abaixo dos
  campos de sinal e pró-soluto.
- **Exportação PDF** branded (logo, cores, assinatura do rodapé do consultor).
- **Texto WhatsApp** formatado com `*negrito*`, separadores e link
  `wa.me/<telefone>` pré-preenchido.
- **CRUD de propostas salvas** por consultor com busca por cliente /
  empreendimento.

### Para o administrador

- **Bootstrap do primeiro admin** — o primeiro usuário cadastrado pode reclamar
  privilégios de admin enquanto a tabela `user_roles` estiver vazia.
- **Gestão de consultores** — criar (e-mail/senha), suspender, reativar e
  excluir.
- **Reset de senha** — definir senha temporária para um consultor.
- **Promoção de papéis** — promover/rebaixar consultor ↔ admin.

---

## Stack técnica

| Camada | Tecnologia |
| --- | --- |
| Framework | [TanStack Start v1](https://tanstack.com/start) (SSR + file-based routing) |
| UI | React 19, Tailwind CSS v4, shadcn/ui (Radix UI), lucide-react |
| Estado / dados | TanStack Query, React Hook Form, Zod |
| Backend | Supabase (Postgres + Auth + RLS) via Lovable Cloud |
| Runtime de servidor | Cloudflare Workers (`nodejs_compat`) |
| Build | Vite 7 + `@cloudflare/vite-plugin` |
| PDF | jsPDF |
| Lint / format | ESLint 9, Prettier 3 |

---

## Arquitetura

```text
┌───────────────────────────────────────────────────────────────┐
│  Browser (React 19 + TanStack Router)                         │
│   ─ Rotas em src/routes/                                       │
│   ─ Cliente Supabase (publishable key, RLS aplicada)          │
│   ─ TanStack Query para cache de propostas                    │
└──────────────────────────┬────────────────────────────────────┘
                           │ RPC tipado (createServerFn)
                           │ + Bearer JWT injetado por
                           │   attachSupabaseAuth middleware
                           ▼
┌───────────────────────────────────────────────────────────────┐
│  Cloudflare Worker (TanStack Start SSR)                       │
│   ─ src/lib/admin.functions.ts  → server functions admin      │
│   ─ src/lib/admin.server.ts     → assertAdmin (service role)  │
│   ─ requireSupabaseAuth         → valida JWT a cada chamada   │
└──────────────────────────┬────────────────────────────────────┘
                           │ supabase-js (service role)
                           ▼
┌───────────────────────────────────────────────────────────────┐
│  Supabase (Lovable Cloud)                                     │
│   ─ auth.users          (gerenciado pelo Supabase)            │
│   ─ public.profiles     (1:1 com auth.users, white-label)     │
│   ─ public.user_roles   (enum app_role: admin | consultor)    │
│   ─ public.has_role()   (SECURITY DEFINER, evita recursão RLS)│
└───────────────────────────────────────────────────────────────┘
```

### Padrões adotados

- **Server functions (`createServerFn`)** para toda lógica que toca o
  service-role do Supabase — nunca exposta ao cliente.
- **RLS em todas as tabelas públicas**, com função `has_role()` SECURITY
  DEFINER para evitar recursão.
- **Papéis em tabela separada** (`user_roles`) — nunca em `profiles` — para
  prevenir escalonamento de privilégios.
- **Design tokens semânticos** em `src/styles.css` (`oklch`), sem cores
  hard-coded nos componentes.

---

## Modelo de dados

```sql
-- Enum de papéis
create type public.app_role as enum ('admin', 'consultor');

-- Perfil white-label do consultor
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  creci text,
  telefone text,
  cidade text,
  uf text,
  logo_url text,
  cor_primaria text,
  cor_secundaria text,
  assinatura_rodape text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Papéis (separado para evitar privilege escalation)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- Verificação de papel sem recursão de RLS
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.user_roles where user_id = _user_id and role = _role
) $$;
```

---

## Regras de negócio

As fórmulas centrais vivem em [`src/lib/proposal.ts`](src/lib/proposal.ts).

| Variável | Fórmula |
| --- | --- |
| V.F (financiável) | `V.A × pct`, onde `pct = 0.90 (SAC)` ou `0.80 (PRICE)` |
| V.E (entrada) | `max(0, V.V − V.F)` |
| S.A default | `V.V × 2%` |
| P.S | `max(0, V.E − S.A − E.C)` |
| Parcela P.S corrigida | 0,5% a.m. até a 36ª · 1,5% a.m. da 37ª à 84ª |
| Limite de parcelas P.S | Riva: 48 · Direcional: 84 |
| Curva do seguro de obra | `inicial + (final − inicial) × tᵏ`, k = 1.6 |

---

## Como rodar localmente

> Este projeto foi criado dentro do [Lovable](https://lovable.dev/) com
> Lovable Cloud habilitado. As variáveis de ambiente do Supabase já vêm
> populadas via `.env` quando o projeto é clonado a partir do Lovable.

```bash
# 1. Instalar dependências
bun install

# 2. Rodar o dev server (Vite + TanStack Start)
bun run dev

# 3. Build de produção (Cloudflare Worker)
bun run build
```

Variáveis esperadas em `.env`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
# Server-only (não expor ao cliente)
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Estrutura de pastas

```text
src/
├── routes/                       # File-based routing (TanStack Router)
│   ├── __root.tsx                # Shell HTML + providers
│   ├── login.tsx, signup.tsx
│   ├── _authenticated.tsx        # Gate de autenticação (Outlet)
│   └── _authenticated/
│       ├── index.tsx             # Editor da proposta
│       ├── minha-conta.tsx       # Perfil white-label
│       └── admin.tsx             # Dashboard admin
├── lib/
│   ├── proposal.ts               # Regras de negócio + WhatsApp
│   ├── pdf.ts                    # Geração de PDF (jsPDF)
│   ├── storage.ts                # CRUD de propostas
│   ├── admin.functions.ts        # Server functions admin
│   └── admin.server.ts           # assertAdmin (service role)
├── integrations/supabase/        # Clients (browser, server, admin)
├── hooks/use-auth.tsx            # Contexto de autenticação
├── components/ui/                # shadcn/ui
└── styles.css                    # Design tokens (oklch)

supabase/
├── config.toml
└── migrations/                   # SQL versionado
docs/
├── PRD.md                        # Product Requirements Document
├── ARCHITECTURE.md               # Decisões técnicas
├── ROADMAP.md                    # Próximos passos
└── CONTRIBUTING.md
```

---

## Roadmap

Veja [docs/ROADMAP.md](docs/ROADMAP.md) para a lista completa. Highlights:

- [ ] Multi-construtora dinâmica (config por admin, sem hard-code)
- [ ] Templates de proposta customizáveis pelo consultor
- [ ] Métricas: propostas geradas/semana, taxa de conversão por consultor
- [ ] Integração com WhatsApp Business API (envio direto, sem `wa.me`)
- [ ] App mobile (PWA → React Native)

---

## Documentação adicional

- [PRD — Product Requirements Document](docs/PRD.md)
- [Arquitetura técnica](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Guia de contribuição](docs/CONTRIBUTING.md)
- [Changelog](docs/CHANGELOG.md)

---

## Licença

Projeto de portfólio — uso e estudo livre. Marca "TLM / Tales Medeiros
Consultoria Imobiliária" pertence aos respectivos titulares.
