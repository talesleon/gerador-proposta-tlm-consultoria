// Cálculos e formatações da proposta TLM

export type Builder = "Riva" | "Direcional";

export const MAX_PS_PARCELAS: Record<Builder, number> = {
  Riva: 48,
  Direcional: 84,
};

export interface ProposalInput {
  builder: Builder;
  empreendimento: string;
  unidade: string; // ex: "BL01 - 1904"
  tipologia: string; // ex: "2 quartos com suíte e varanda"
  entrega: string; // ex: "Fev/2029"
  vt: number; // Valor Tabela
  vv: number; // Valor Venda
  va: number; // Valor Avaliação
  saOverride: number | null; // Sinal Ato editado pelo usuário (se null, usa 2% V.V)
  saParcelas: number; // 1..12
  psParcelas: number; // 1..MAX
  seguroInicial: number;
  seguroFinal: number;
  posObraInicio: string; // ex: "março de 2029"
}

export interface ProposalComputed {
  vf: number; // 80% V.A
  ve: number; // V.V - V.F
  saDefault: number; // 2% V.V
  sa: number; // SA efetivo (override ou default)
  ps: number; // V.E - S.A
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
  // remove tudo que não é dígito, vírgula ou ponto
  const cleaned = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Texto otimizado para WhatsApp (usa *negrito* e indentação). */
export function buildWhatsAppText(input: ProposalInput, c: ProposalComputed): string {
  const lines: string[] = [];
  lines.push(`*${input.empreendimento || "Empreendimento"}*`);
  if (input.unidade || input.tipologia) {
    lines.push(`${input.unidade}${input.unidade && input.tipologia ? ": " : ""}${input.tipologia}`);
  }
  if (input.entrega) lines.push(`Entrega: ${input.entrega}`);
  lines.push("--------------------------------");
  lines.push(`Preço Tabela: ${formatBRL(input.vt)}`);
  lines.push(`Nossa negociação: *${formatBRL(input.vv)}*`);
  lines.push(`Estrutura de Pagamento:`);
  lines.push(`1. ENTRADA:`);
  lines.push(`    Sinal ato: ${formatBRL(c.sa)} (até ${input.saParcelas}x cartão)`);
  lines.push(
    `    Pró-soluto: ${formatBRL(c.ps)} (até ${input.psParcelas}x no boleto com correção)`,
  );
  lines.push(`2. Seguro de Obra:`);
  lines.push(`    Inicial: ${formatBRLCompact(input.seguroInicial)}`);
  lines.push(`    Final: +-${formatBRLCompact(input.seguroFinal)}`);
  lines.push(`3. Pós-obra:`);
  lines.push(
    `    Direto com o banco, somente em ${input.posObraInicio || "(definir mês/ano)"}`,
  );
  return lines.join("\n");
}

export function todayBR(): string {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
