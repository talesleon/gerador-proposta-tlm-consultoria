// Cálculos e formatações da proposta TLM

export type Builder = "Riva" | "Direcional";

export const MAX_PS_PARCELAS: Record<Builder, number> = {
  Riva: 48,
  Direcional: 84,
};

export type SistemaFinanciamento = "SAC" | "PRICE";

export const FINANCIAMENTO_PCT: Record<SistemaFinanciamento, number> = {
  SAC: 0.9,
  PRICE: 0.8,
};

export interface ProposalInput {
  builder: Builder;
  sistemaFinanciamento: SistemaFinanciamento;
  clienteNome: string;
  clienteTelefone: string;
  empreendimento: string;
  unidade: string;
  tipologia: string;
  entrega: string;
  vt: number;
  vv: number;
  va: number;
  saOverride: number | null;
  ec: number;
  saParcelas: number;
  psParcelas: number;
  seguroInicial: number;
  seguroFinal: number;
  seguroMarcos: number; // qtd de marcos trimestrais no gráfico (0 = auto)
  posObraInicio: string;
}

export interface ProposalComputed {
  vf: number;
  ve: number;
  saDefault: number;
  sa: number;
  ec: number;
  ps: number;
  saValid: boolean;
  ecValid: boolean;
  psValid: boolean;
  psMax: number;
}

export function compute(input: ProposalInput): ProposalComputed {
  const pct = FINANCIAMENTO_PCT[input.sistemaFinanciamento] ?? 0.8;
  const vf = input.va * pct;
  const ve = Math.max(0, input.vv - vf);
  const saDefault = input.vv * 0.02;
  const sa = input.saOverride ?? saDefault;
  const ec = Math.max(0, input.ec || 0);
  const ps = Math.max(0, ve - sa - ec);
  const psMax = MAX_PS_PARCELAS[input.builder];
  return {
    vf,
    ve,
    saDefault,
    sa,
    ec,
    ps,
    saValid: sa >= 0 && sa <= ve,
    ecValid: ec >= 0 && sa + ec <= ve,
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
 * Extrai apenas dígitos de um telefone e garante prefixo 55 (Brasil).
 * Retorna string vazia se não houver dígitos suficientes.
 */
export function normalizeWhatsAppPhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length < 10) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

/**
 * Texto otimizado para WhatsApp.
 * Usa *negrito*, emojis sutis, blocos separados por linha em branco
 * e indentação leve para facilitar leitura.
 */
/**
 * Parcela do pró-soluto com correção contratual aplicada:
 * 0,5% a.m. até a parcela 36, 1,5% a.m. das parcelas 37 a 84.
 * Retorna: (somatório das parcelas corrigidas) / n.
 */
export function proSolutoParcelaCorrigida(ps: number, n: number): number {
  if (ps <= 0 || n <= 0) return 0;
  const base = ps / n;
  let factor = 1;
  let totalCorrigido = 0;
  for (let i = 1; i <= n; i++) {
    const rate = i <= 36 ? 0.005 : 0.015;
    factor *= 1 + rate;
    totalCorrigido += base * factor;
  }
  return totalCorrigido / n;
}

export function buildWhatsAppText(input: ProposalInput, c: ProposalComputed): string {
  const L: string[] = [];
  const sep = "━━━━━━━━━━━━";

  // Cabeçalho
  L.push(`*${input.empreendimento || "Empreendimento"}*`);
  L.push("");
  if (input.unidade) {
    L.push(input.unidade);
    L.push("");
  }
  if (input.tipologia) {
    L.push(input.tipologia);
    L.push("");
  }
  if (input.entrega) {
    L.push(`Entrega: *${input.entrega}*`);
    L.push("");
  }
  L.push(sep);
  L.push("");

  // Valores
  L.push(`💰 *VALORES*`);
  L.push("");
  L.push(`Preço tabela: ${formatBRL(input.vt)}`);
  L.push("");
  L.push(`Nossa negociação: *${formatBRL(input.vv)}*`);
  const desconto = input.vt - input.vv;
  if (desconto > 0) {
    L.push("");
    L.push(`Economia: ${formatBRL(desconto)}`);
  }
  L.push("");
  L.push(sep);
  L.push("");

  // Pagamento
  L.push(`📋 *ESTRUTURA DE PAGAMENTO*`);
  L.push("");
  L.push(`💳 *1.  ENTRADA*`);
  L.push("");
  const saParcela = input.saParcelas > 0 ? c.sa / input.saParcelas : 0;
  const psParcela = input.psParcelas > 0 ? c.ps / input.psParcelas : 0;
  L.push(`   • Sinal ato — *${formatBRL(saParcela)}*`);
  L.push(`     ${input.saParcelas}x no cartão`);
  L.push(`     total ${formatBRL(c.sa)}`);
  L.push("");
  if (c.ec > 0) {
    L.push(`   • Entrada Cliente — *${formatBRL(c.ec)}*`);
    L.push(`     à vista`);
    L.push("");
  }
  const psCorrigida = proSolutoParcelaCorrigida(c.ps, input.psParcelas);
  L.push(`   • Pró-soluto — *${formatBRL(psParcela)}*`);
  L.push(`     ${input.psParcelas}x no boleto`);
  if (psCorrigida > 0) {
    L.push(`     corrigida ≈ ${formatBRL(psCorrigida)} (0,5% a.m. até 36ª · 1,5% a.m. da 37ª à 84ª)`);
  }
  L.push(`     total ${formatBRL(c.ps)}`);
  L.push("");
  L.push(`🏗️ *2.  SEGURO DE OBRA*  _(evolui junto com a obra)_`);
  L.push("");
  const meses = tempoObraMeses(input.entrega);
  const evo = seguroEvolucao(input.seguroInicial, input.seguroFinal, meses, input.seguroMarcos);
  if (evo.length >= 2) {
    const blocks = "▁▂▃▄▅▆▇█";
    const max = evo[evo.length - 1].valor;
    const min = evo[0].valor;
    const spark = evo
      .map((p) => {
        const t = max > min ? (p.valor - min) / (max - min) : 0;
        return blocks[Math.min(blocks.length - 1, Math.round(t * (blocks.length - 1)))];
      })
      .join("");
    L.push(`   ${spark}`);
    L.push(
      `   Começa em ±${formatBRLCompact(input.seguroInicial)} e chega a ±${formatBRLCompact(input.seguroFinal)} perto da entrega.`,
    );
    if (input.seguroFinal > 0) {
      L.push(`   Média: ±${formatBRLCompact(input.seguroFinal / meses)} / mês (${meses} meses de obra)`);
    }
  } else {
    L.push(`   • Inicial: ±${formatBRLCompact(input.seguroInicial)}`);
    L.push(`   • Final: ±${formatBRLCompact(input.seguroFinal)}`);
  }
  L.push("");
  L.push(`🔑 *3.  PÓS-OBRA*`);
  L.push("");
  L.push(`   • Financiamento direto com o banco`);
  L.push(`   • A partir de *${input.posObraInicio || "(definir)"}*`);
  L.push("");
  L.push(sep);
  L.push("");
  L.push(
    `Tales Medeiros Consultoria Imobiliária ·  Simulação. Valores e condições sujeitos à análise de crédito e confirmação pela construtora. Validade: 7 dias. ${todayBR()}`,
  );

  return L.join("\n");
}

export function todayBR(): string {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const MESES_PT: Record<string, number> = {
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
};

/** "Fev/2029", "02/2029", "fevereiro 2029" → {month, year} */
export function parseEntrega(raw: string): { month: number; year: number } | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  const m1 = s.match(/^(\d{1,2})[\/\-\s](\d{4})$/);
  if (m1) {
    const mo = Number(m1[1]) - 1;
    if (mo >= 0 && mo <= 11) return { month: mo, year: Number(m1[2]) };
  }
  const m2 = s.match(/^([a-zà-ú]+)[\/\-\s]+(\d{4})$/);
  if (m2) {
    const key = m2[1].slice(0, 3);
    if (key in MESES_PT) return { month: MESES_PT[key], year: Number(m2[2]) };
  }
  return null;
}

/** Meses entre hoje e a entrega. 0 se inválido, mínimo 1 caso contrário. */
export function tempoObraMeses(entregaRaw: string, ref: Date = new Date()): number {
  const e = parseEntrega(entregaRaw);
  if (!e) return 0;
  const diff = (e.year - ref.getFullYear()) * 12 + (e.month - ref.getMonth());
  return Math.max(1, diff);
}

/**
 * Gera marcos trimestrais da evolução do seguro.
 * - n: quantidade de marcos (mínimo 2). Se 0/inválido, usa auto = max(2, ceil(meses/3)).
 * - Curva levemente exponencial (k=1.6) para refletir aceleração no fim da obra.
 * Retorna array com { mes, valor } onde mes 0 = início, último = entrega.
 */
export function seguroEvolucao(
  inicial: number,
  final: number,
  meses: number,
  n: number,
): { mes: number; valor: number }[] {
  if (meses <= 0 || final <= 0) return [];
  const auto = Math.max(2, Math.ceil(meses / 3));
  const count = n && n >= 2 ? Math.min(n, 12) : auto;
  const k = 1.6;
  const out: { mes: number; valor: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1); // 0..1
    const eased = Math.pow(t, k);
    out.push({
      mes: Math.round(t * meses),
      valor: inicial + (final - inicial) * eased,
    });
  }
  return out;
}

