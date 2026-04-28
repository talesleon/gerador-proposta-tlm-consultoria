// Cálculos e formatações da proposta TLM

export type Builder = "Riva" | "Direcional";

export const MAX_PS_PARCELAS: Record<Builder, number> = {
  Riva: 48,
  Direcional: 84,
};

export interface ProposalInput {
  builder: Builder;
  empreendimento: string;
  unidade: string;
  tipologia: string;
  entrega: string;
  vt: number;
  vv: number;
  va: number;
  saOverride: number | null;
  saParcelas: number;
  psParcelas: number;
  seguroInicial: number;
  seguroFinal: number;
  posObraInicio: string;
}

export interface ProposalComputed {
  vf: number;
  ve: number;
  saDefault: number;
  sa: number;
  ps: number;
  saValid: boolean;
  psValid: boolean;
  psMax: number;
}

export function compute(input: ProposalInput): ProposalComputed {
  const vf = input.va * 0.8;
  const ve = Math.max(0, input.vv - vf);
  const saDefault = input.vv * 0.02;
  const sa = input.saOverride ?? saDefault;
  const ps = Math.max(0, ve - sa);
  const psMax = MAX_PS_PARCELAS[input.builder];
  return {
    vf,
    ve,
    saDefault,
    sa,
    ps,
    saValid: sa >= 0 && sa <= ve,
    psValid: input.psParcelas >= 1 && input.psParcelas <= psMax,
    psMax,
  };
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatBRL(n: number): string {
  if (!Number.isFinite(n)) return "R$ 0,00";
  return brl.format(n);
}

export function formatBRLCompact(n: number): string {
  if (!Number.isFinite(n)) return "R$ 0";
  return brlCompact.format(n);
}

export function parseBRLInput(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Texto otimizado para WhatsApp.
 * Usa *negrito*, emojis sutis, blocos separados por linha em branco
 * e indentação leve para facilitar leitura.
 */
export function buildWhatsAppText(input: ProposalInput, c: ProposalComputed): string {
  const L: string[] = [];
  const sep = "━━━━━━━━━━━━━━━━━━━";

  // Cabeçalho
  L.push(`🏢 *${input.empreendimento || "Empreendimento"}*`);
  if (input.unidade) L.push(`📍 ${input.unidade}`);
  if (input.tipologia) L.push(`🛏️ ${input.tipologia}`);
  if (input.entrega) L.push(`🔑 Entrega: *${input.entrega}*`);
  L.push("");
  L.push(sep);

  // Valores
  L.push(`💰 *VALORES*`);
  L.push(`Preço tabela: ~${formatBRL(input.vt)}~`);
  L.push(`Nossa negociação: *${formatBRL(input.vv)}*`);
  const desconto = input.vt - input.vv;
  if (desconto > 0) {
    L.push(`_Economia: ${formatBRL(desconto)}_`);
  }
  L.push("");
  L.push(sep);

  // Pagamento
  L.push(`📋 *ESTRUTURA DE PAGAMENTO*`);
  L.push("");
  L.push(`*1️⃣  ENTRADA*`);
  L.push(`   • Sinal ato: *${formatBRL(c.sa)}*`);
  L.push(`     _até ${input.saParcelas}x no cartão_`);
  L.push(`   • Pró-soluto: *${formatBRL(c.ps)}*`);
  L.push(`     _até ${input.psParcelas}x no boleto c/ correção_`);
  L.push("");
  L.push(`*2️⃣  SEGURO DE OBRA*`);
  L.push(`   • Inicial: *${formatBRLCompact(input.seguroInicial)}*`);
  L.push(`   • Final: *±${formatBRLCompact(input.seguroFinal)}*`);
  L.push("");
  L.push(`*3️⃣  PÓS-OBRA*`);
  L.push(`   • Financiamento direto com o banco`);
  L.push(`   • A partir de *${input.posObraInicio || "(definir)"}*`);
  L.push("");
  L.push(sep);
  L.push(`_TLM Negócios Imobiliários · ${input.builder}_`);

  return L.join("\n");
}

export function todayBR(): string {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
