# Roadmap

> Lista viva de evoluções. Itens marcados ✅ estão no MVP.

## Now (entregue)

- ✅ Editor de proposta com cálculo em tempo real
- ✅ Riva (48x) / Direcional (84x)
- ✅ SAC / PRICE
- ✅ Correção contratual do pró-soluto
- ✅ Curva do seguro de obra
- ✅ PDF white-label + texto WhatsApp
- ✅ CRUD de propostas
- ✅ Autenticação + RLS
- ✅ Dashboard admin

## Next (próximo trimestre)

- [ ] **Construtoras configuráveis** — mover Riva/Direcional para tabela
      `builders` editável pelo admin (limites de parcelas, % financiamento)
- [ ] **Templates de mensagem** — admin define o template padrão de
      WhatsApp; consultor pode sobrescrever localmente
- [ ] **Multi-imobiliária (multi-tenant)** — coluna `org_id` em `profiles`
      e `proposals`; RLS por organização
- [ ] **Logs de envio** — registrar quando cada proposta foi
      exportada/enviada para análise de funil
- [ ] **Testes automatizados** — Vitest para `proposal.ts` + Playwright
      para fluxo de login → gerar → exportar

## Later

- [ ] **WhatsApp Business API** — envio direto, sem passar pelo `wa.me`
- [ ] **Assinatura digital da proposta** (DocuSign / Clicksign)
- [ ] **Integração com CRM** (RD Station, HubSpot) — exportar lead +
      proposta como uma oportunidade
- [ ] **PWA + push notifications** — consultor recebe alerta quando o
      cliente abre o PDF
- [ ] **Dashboard de métricas** — propostas/consultor/semana, taxa de
      conversão, valor médio, ranking
- [ ] **IA — sugestão de negociação** — modelo recomenda desconto máximo
      com base no histórico de fechamentos
- [ ] **App mobile nativo** (React Native compartilhando lógica de
      `src/lib/proposal.ts`)

## Dívida técnica

- [ ] Migrar `src/lib/storage.ts` para `createServerFn` (hoje usa cliente
      browser direto com RLS — funciona, mas centralizar é melhor)
- [ ] Substituir jsPDF por `@react-pdf/renderer` para layouts mais ricos
- [ ] Adicionar `error-boundary` e `not-found` em cada rota com loader
- [ ] Internationalização (i18n) — hoje pt-BR hard-coded
