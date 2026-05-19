# Changelog

Todos os releases relevantes deste projeto.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [1.0.0] — 2026-05

### Adicionado
- Editor de proposta com cálculo em tempo real.
- Suporte a construtoras Riva (48x) e Direcional (84x).
- Sistemas de financiamento SAC (90% V.A) e PRICE (80% V.A).
- Correção contratual do pró-soluto (0,5%/1,5% a.m.).
- Curva de evolução do seguro de obra com sparkline.
- Exportação de PDF white-label e texto pronto para WhatsApp.
- CRUD de propostas salvas por consultor.
- Tela "Minha conta" para configurar logo, cores, CRECI e assinatura.
- Autenticação por e-mail + senha (Supabase Auth).
- Dashboard administrativo: criar, suspender, excluir, promover usuários
  e resetar senhas.
- RLS em todas as tabelas; papéis em tabela separada (`user_roles`) com
  função `has_role()` SECURITY DEFINER.

### Infra
- TanStack Start v1 sobre Cloudflare Workers.
- Supabase via Lovable Cloud.
- Tailwind v4 + shadcn/ui.
