## Plano

### 1. Atualizar template do WhatsApp (`src/lib/proposal.ts`)

Substituir `buildWhatsAppText` para seguir exatamente o modelo aprovado, **sem emojis**:

- Cabeçalho em negrito do empreendimento, depois unidade, tipologia e `Entrega: *...*`, separados por linha em branco.
- Separador `━━━━━━━━━━━━` entre blocos.
- Bloco `*VALORES*` com:
  - `Preço tabela: R$ ...`
  - `Nossa negociação: R$ ...`
  - `Economia: R$ ...` (apenas se `vt − vv > 0`)
- Bloco `*ESTRUTURA DE PAGAMENTO*` com três sub-blocos numerados em texto:
  - `*1.  ENTRADA*` → Sinal ato + linha "até Nx no cartão"; Pró-soluto + linha "até Nx no boleto c/ correção".
  - `*2.  SEGURO DE OBRA*` → Inicial e Final (`±`).
  - `*3.  PÓS-OBRA*` → "Financiamento direto com o banco" + "A partir de *MÊS ANO*".
- Rodapé único: `TLM Negócios Imobiliários ·  Valores e condições sujeitos à análise de crédito e confirmação pela construtora. Validade: 7 dias. {todayBR()}`.

Sem alteração em `pdf.ts` ou no UI por causa do texto.

### 2. Mostrar parcela estimada na "Composição da entrada" (`src/routes/index.tsx`)

Na seção `Composição da entrada`, exibir o valor da parcela estimada, em fonte menor e cor secundária, abaixo de cada um dos campos de parcelas:

- Abaixo de **Parcelas do Sinal (cartão)**: texto pequeno `≈ R$ X / mês` calculado como `c.sa / input.saParcelas` (quando ambos > 0).
- Abaixo de **Parcelas do Pró-soluto (boleto)**: texto pequeno `≈ R$ X / mês` calculado como `c.ps / input.psParcelas` (quando ambos > 0).

Implementação: usar a prop `helper` já existente do componente `Field` para o pró-soluto (concatenando com a mensagem de erro quando houver) e adicionar `helper` ao campo de parcelas do sinal. Formatação com `formatBRL`.

### Detalhes técnicos

- `buildWhatsAppText`: marcação WhatsApp usa `*negrito*`. Cada bloco com `L.push("")` para linhas em branco. Sem emojis nem `~tachado~` no novo modelo.
- A parcela estimada é puramente informativa (não entra no PDF nem no texto WhatsApp neste passo).
- Nada de novas dependências.