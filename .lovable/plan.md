# Gerador de Proposta TLM Negócios Imobiliários

App web (mobile-first, Material Design) para corretores gerarem propostas de venda de apartamentos da Riva e Direcional, com fluxo de pagamento transparente, exportação em PDF (fundo preto) e texto otimizado para WhatsApp.

## Telas e fluxo

Aplicação de página única com duas áreas:

1. **Formulário (esquerda em desktop, topo em mobile)** — Material Design com Cards, TextFields outlined, Switches e Chips.
2. **Pré-visualização da proposta (direita / abaixo)** — mockup de mensagem WhatsApp + botões de exportação.

```text
┌─────────────────┬──────────────────────┐
│  FORMULÁRIO     │   PRÉ-VISUALIZAÇÃO   │
│  (Material)     │   (preto/dourado)    │
│                 │                      │
│  [Empreend.]    │   Card vertical      │
│  [Valores]     →│   estilo proposta    │
│  [Pagamento]    │                      │
│  [Seguro obra]  │   [Copiar Texto]     │
│                 │   [Baixar PDF]       │
└─────────────────┴──────────────────────┘
```

## Seções do formulário

**1. Empreendimento**
- Construtora (chips Riva / Direcional) — define limite de parcelas P.S. (Riva 48x, Direcional 84x)
- Nome do empreendimento (ex: "Priori Residence")
- Bloco / Unidade (ex: "BL01 - 1904")
- Tipologia (ex: "2 quartos com suíte e varanda")
- Previsão de entrega (ex: "Fev/2029")

**2. Valores (entradas do corretor)**
- V.T — Valor Tabela
- V.V — Valor Venda (negociação)
- V.A — Valor Avaliação do banco

**3. Calculados (somente leitura, atualizam em tempo real)**
- V.F = 80% × V.A (Valor Financiável)
- V.E = V.V − V.F (Valor Entrada)
- S.A = 2% × V.V (Sinal Ato — editável, com botão "resetar para 2%")
- P.S = V.E − S.A (Pró-soluto)

**4. Parcelamento**
- Sinal Ato: parcelas no cartão (1–12x, default 12)
- Pró-soluto: parcelas no boleto (campo livre, validado contra o limite da construtora — alerta se exceder)

**5. Seguro de obra**
- Valor inicial (R$)
- Valor final (R$)
- Mês/ano de início pós-obra (ex: "Março de 2029")

## Validação e regras

- Todos os valores monetários com máscara R$ e parsing seguro (zod).
- V.V não pode ser maior que V.T (warning, não bloqueio).
- V.E deve ser ≥ S.A; caso contrário mostra erro.
- Parcelas P.S validadas contra construtora; mostra "máx. Xx para [construtora]".
- Mensagens de erro inline em estilo Material (helper text vermelho).

## Saídas

**A. Texto WhatsApp (botão "Copiar Texto")**
Formato exato do exemplo, com `*negrito*`:
```
*Priori Residence*
BL01 - 1904: 2 quartos com suíte e varanda
Entrega: Fev/2029
--------------------------------
Preço Tabela: R$558.147,19
Nossa negociação: *R$503.000,00*
Estrutura de Pagamento:
1. ENTRADA:
    Sinal ato: R$10.060,00 (até 12x cartão)
    Pró-soluto: R$81.440,00 (até 84x no boleto com correção)
2. Seguro de Obra:
    Inicial: R$0
    Final: +-R$1.600
3. Pós-obra:
    Direto com o banco, somente em março de 2029
```

**B. PDF (botão "Baixar PDF")**
- Fundo preto (`#111518`), acentos dourados (`#b8952a`), tipografia clara (Cormorant Garamond para preços, Figtree para corpo).
- Formato vertical estreito (tipo story 1080×1920 ou A5 retrato) — ótimo para visualização no WhatsApp em tela cheia, sem zoom.
- Estrutura: cabeçalho com empreendimento e unidade → preço tabela vs negociação (destaque) → blocos numerados (Entrada, Seguro de Obra, Pós-obra) → rodapé com data e disclaimer ("Valores sujeitos a confirmação...").
- Nome do arquivo: `Proposta_[Empreendimento]_[Unidade].pdf`.

## Design System (Material Design 3)

- **Tema**: light no formulário, dark "premium" (preto + dourado) na pré-visualização e PDF — alinhado ao HTML enviado.
- Componentes: Cards com elevação suave, TextFields outlined, FilledButton para ação primária ("Gerar"), Chips para construtora, Snackbar para feedback ("Texto copiado!").
- Mobile-first: formulário e preview empilhados em telas <900px; preview com sticky bottom-bar de ações.
- Acessibilidade: labels visíveis, contraste AA, foco visível.

## Detalhes técnicos

- TanStack Start, rota única `/`.
- Cálculo 100% client-side; nenhum dado sai do navegador (sem Lovable Cloud).
- Geração de PDF com `pdf-lib` (compatível com Worker — sem dependências nativas), ou render do componente preview em canvas via `html-to-image` + `jsPDF`. Decisão final na implementação após testar fidelidade visual.
- Cópia de texto via `navigator.clipboard.writeText`.
- Formatação monetária com `Intl.NumberFormat('pt-BR')`.
- Validação com zod.
- Estado local com `useState` (sem store global necessário).
- Persistência opcional do último formulário em `localStorage` para retomar trabalho.
