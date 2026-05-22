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
  ecParcelas: number;
  saParcelas: number;
  psParcelas: number;
  seguroInicial: number;
  seguroFinal: number;
  seguroMarcos: number; // qtd de marcos trimestrais no gráfico (0 = auto)
  posObraInicio: string;
  posObraPrazoMeses: number;
  posObraJurosAA: number; // juros nominais ao ano (%)
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

/**
 * Parcela mensal pelo sistema PRICE.
 * vf: valor financiado · n: prazo em meses · jurosAA: juros nominais % ao ano.
 */
export function parcelaPricePosObra(vf: number, n: number, jurosAA: number): number {
  if (vf <= 0 || n <= 0) return 0;
  const i = Math.pow(1 + jurosAA / 100, 1 / 12) - 1;
  if (i <= 0) return vf / n;
  return (vf * i) / (1 - Math.pow(1 + i, -n));
}

export function buildWhatsAppText(input: ProposalInput, c: ProposalComputed): string {
  const L: string[] = [];
  const sep = "━━━━━━━━━━━━";

  // Helper: adiciona linha seguida de linha em branco
  const add = (s: string) => {
    L.push(s);
    L.push("");
  };
  const addSep = () => {
    L.push(sep);
    L.push("");
  };

  // Cabeçalho
  add(`🏢 *${input.empreendimento || "Empreendimento"}*`);
  const unidadeTipologia = [input.unidade, input.tipologia].filter(Boolean).join(" | ");
  if (unidadeTipologia) add(unidadeTipologia);
  if (input.entrega) add(`Entrega: *${input.entrega}*`);
  addSep();

  // Valores
  add(`💰 *VALORES*`);
  add(`Tabela: ${formatBRL(input.vt)}`);
  add(`Negociado: *${formatBRL(input.vv)}*`);
  const desconto = input.vt - input.vv;
  if (desconto > 0) add(`Você economiza: ${formatBRL(desconto)}`);
  addSep();

  // Entrada
  add(`💳 *ENTRADA*`);
  const saParcela = input.saParcelas > 0 ? c.sa / input.saParcelas : 0;
  const saVia = input.saParcelas > 1 ? `${input.saParcelas}x no cartão` : "à vista";
  add(`Sinal ato: *${formatBRL(saParcela)}* — ${saVia}`);
  add(`_(Total ${formatBRL(c.sa)})_`);
  if (c.ec > 0) {
    const ecN = Math.max(1, input.ecParcelas || 1);
    const ecParcela = c.ec / ecN;
    const ecVia = ecN === 1 ? "à vista" : `${ecN}x no boleto`;
    add(`Entrada cliente: *${formatBRL(ecParcela)}* — ${ecVia}`);
    add(`_(Total ${formatBRL(c.ec)})_`);
  }
  const psCorrigida = proSolutoParcelaCorrigida(c.ps, input.psParcelas);
  if (psCorrigida > 0) {
    add(`Pró-soluto com correção: ≈ ${formatBRL(psCorrigida)}/mês`);
    add(`_(0,5% a.m. até a 36ª e 1,5% a.m. da 37ª à 84ª)._`);
  }
  addSep();

  // Seguro
  add(`🏗️ *SEGURO DE OBRA*`);
  const meses = tempoObraMeses(input.entrega);
  if (input.seguroFinal > 0 && meses > 0) {
    const evo = seguroEvolucao(input.seguroInicial, input.seguroFinal, meses, input.seguroMarcos);
    add(`Pago à Caixa durante a obra. Começa em ±${formatBRLCompact(input.seguroInicial)} e vai até ±${formatBRLCompact(input.seguroFinal)} perto da entrega.`);
    if (evo.length > 0) {
      const media = evo.reduce((s, p) => s + p.valor, 0) / evo.length;
      add(`Média: ±${formatBRLCompact(media)}/mês (${meses} meses).`);
    }
  } else {
    add(`Inicial: ±${formatBRLCompact(input.seguroInicial)}`);
    add(`Final: ±${formatBRLCompact(input.seguroFinal)}`);
  }
  addSep();

  // Pós-obra
  add(`🔑 *PÓS-OBRA*`);
  add(`Financiamento direto com o banco, a partir de *${input.posObraInicio || "(definir)"}*.`);
  if (c.vf > 0 && input.posObraPrazoMeses > 0) {
    const parc = parcelaPricePosObra(c.vf, input.posObraPrazoMeses, input.posObraJurosAA);
    const anos = Math.round(input.posObraPrazoMeses / 12);
    add(`Parcela estimada: *${formatBRL(parc)}*`);
    add(`_${input.posObraPrazoMeses}x (${anos} anos) · ${input.posObraJurosAA.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% a.a. (PRICE)_`);
    add(`_Valor financiado: ${formatBRL(c.vf)}_`);
  }
  addSep();
  L.push(
    `_Simulação. Valores e condições sujeitos à análise de crédito e confirmação pela construtora. Validade: 7 dias._ Tales Medeiros · Consultoria Imobiliária · ${todayBR()}.`,
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

