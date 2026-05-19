# PRD — Gerador de Propostas Imobiliárias TLM

**Versão:** 1.0 · **Autor:** Product Owner · **Última atualização:** maio/2026

---

## 1. Contexto e problema

Consultores imobiliários do segmento MCMV (Riva, Direcional) atuam num
ciclo de venda curto e majoritariamente via WhatsApp. Para cada lead
qualificado, o consultor precisa montar uma proposta personalizada
contendo:

1. Identificação da unidade (empreendimento, tipologia, entrega).
2. Estrutura de valores (tabela, negociação, economia).
3. Composição da entrada (sinal no cartão + pró-soluto no boleto).
4. Estimativa do seguro de obra ao longo do canteiro.
5. Início do financiamento bancário pós-chaves.

Hoje esse trabalho é feito em **planilhas Excel** e o resultado é
copiado **à mão** para uma mensagem de WhatsApp. Os problemas observados:

| Dor | Impacto |
| --- | --- |
| Erros de cálculo (sinal acima da entrada disponível) | Retrabalho e perda de credibilidade com o cliente |
| Texto WhatsApp inconsistente entre consultores | Marca da imobiliária diluída |
| Sem histórico de propostas por lead | Dificuldade em reabrir negociações |
| Onboarding de consultor novo demora dias | Custo operacional alto |

## 2. Objetivo do produto

> **Permitir que um consultor envie uma proposta profissional e
> matematicamente correta para o WhatsApp do cliente em menos de
> 90 segundos, mantendo a marca da imobiliária padronizada.**

### KPIs-alvo (12 meses)

- ⏱ **Tempo médio para gerar proposta:** ≤ 90s
- 📈 **Propostas geradas/consultor/semana:** ≥ 15
- 🎯 **Taxa de erro de cálculo reportada:** 0
- 👥 **Consultores ativos mensais:** ≥ 20

## 3. Personas

### Consultor (usuário primário)

- 25–45 anos, autônomo ou CLT em imobiliária parceira.
- Vive no WhatsApp e no celular.
- Não sabe SQL; sabe Excel "no nível de SOMA e SE".
- Mede sucesso em propostas enviadas e visitas agendadas.

### Administrador (usuário secundário)

- Sócio ou gerente comercial da imobiliária.
- Precisa garantir consistência de marca e acesso da equipe.
- Foco em governança, não em uso diário do gerador.

## 4. Escopo — MVP (entregue)

### Must-have ✅

- [x] Autenticação por e-mail + senha
- [x] Editor de proposta com cálculo em tempo real
- [x] Suporte às construtoras Riva (48x) e Direcional (84x)
- [x] Sistemas SAC (90%) e PRICE (80%)
- [x] Correção contratual do pró-soluto
- [x] Curva de seguro de obra com sparkline
- [x] Exportação PDF white-label
- [x] Botão "Copiar para WhatsApp" + link `wa.me`
- [x] CRUD de propostas salvas por consultor
- [x] Perfil do consultor (logo, cores, CRECI, assinatura)
- [x] Dashboard admin (criar/suspender/excluir/promover)
- [x] RLS em todas as tabelas + role em tabela separada

### Não-escopo do MVP ❌

- App nativo iOS/Android
- Integração com CRM externo
- Assinatura digital da proposta
- Cobrança/pagamentos via plataforma
- Multi-tenant (uma imobiliária por instância no MVP)

## 5. Requisitos funcionais

### RF-01 — Autenticação
Sistema de login com e-mail + senha. Cadastro público desativado por
padrão; novos consultores são criados pelo admin.

### RF-02 — Editor de proposta
Formulário único com seções: Cliente · Unidade · Valores · Composição da
entrada · Seguro de obra · Pós-obra. Recalcula a cada keystroke.

### RF-03 — Validações
- `S.A + E.C ≤ V.E`
- `1 ≤ parcelas P.S ≤ limite da construtora`
- Telefone do cliente normalizado para formato `wa.me` (+55).

### RF-04 — Exportação
Botões: **Copiar texto WhatsApp**, **Abrir WhatsApp**, **Baixar PDF**.

### RF-05 — Persistência
Cada proposta salva fica vinculada ao `user_id` do consultor. Listagem
com busca por cliente e empreendimento.

### RF-06 — Admin
Tela `/admin` com lista paginada de consultores, ações: criar,
suspender (Supabase `ban_duration`), excluir, resetar senha,
promover/rebaixar role.

## 6. Requisitos não-funcionais

| Categoria | Requisito |
| --- | --- |
| Performance | TTI ≤ 2s em 4G; recálculo da proposta ≤ 16ms |
| Segurança | RLS em todas as tabelas; service role nunca exposta ao client |
| Acessibilidade | Contraste AA; navegação por teclado nos formulários |
| Responsividade | Funciona em telas ≥ 360px (mobile-first) |
| Observabilidade | Logs de server functions disponíveis no Cloud |

## 7. Métricas de sucesso por funcionalidade

| Feature | Métrica |
| --- | --- |
| Editor de proposta | % de propostas concluídas / iniciadas |
| Exportação WhatsApp | Cliques no botão "Abrir WhatsApp" |
| PDF | Downloads de PDF |
| Admin | Tempo médio entre criação e primeiro login do consultor |

## 8. Riscos e mitigações

| Risco | Mitigação |
| --- | --- |
| Mudança nas regras de financiamento das construtoras | Sistema de financiamento parametrizado em `FINANCIAMENTO_PCT`; futuro: mover para tabela `builders` no banco |
| Crescimento da base → custos de Supabase | Lovable Cloud com pricing baseado em uso; monitorar instance size |
| Vazamento de PII (telefone de cliente) | RLS por `user_id`; nenhuma rota pública lista propostas |

## 9. Decisões abertas

- [ ] Multi-tenant (várias imobiliárias na mesma instância) vs single-tenant
- [ ] Templates de proposta editáveis pelo admin
- [ ] Histórico de versões de uma mesma proposta
