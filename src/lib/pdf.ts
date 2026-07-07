import { jsPDF } from "jspdf";
import {
  compute,
  computeTabelaDireta,
  formatBRL,
  formatBRLCompact,
  parcelaPricePosObra,
  proSolutoParcelaCorrigida,
  seguroEvolucao,
  tempoObraMeses,
  todayBR,
  TD_POS_OBRA_PARCELAS,
  type ProposalComputed,
  type ProposalInput,
} from "./proposal";

const INK = "#111518";
const GOLD = "#b8952a";
const GOLD_SOFT = "#d4b060";
const CREAM = "#f6f2eb";
const WHITE = "#ffffff";
const TEXT_SOFT = "#cfcfcf";
const MUTED = "#8a8f99";

/**
 * PDF vertical, fundo preto, dourado.
 * Layout com cursor Y dinâmico — sem sobreposições.
 * Formato 90x180mm (proporção mobile/story, ótimo no WhatsApp).
 */
export function generateProposalPDF(input: ProposalInput, c: ProposalComputed): jsPDF {
  if (input.sistemaFinanciamento === "TABELA_DIRETA") {
    return generateTabelaDiretaPDF(input);
  }
  const W = 90;
  const H = 250;
  const M = 8; // margem segura lateral
  const CW = W - M * 2; // largura útil
  const doc = new jsPDF({ unit: "mm", format: [W, H], orientation: "portrait" });

  // Apenas helvetica (sans-serif) em todo o documento
  doc.setFont("helvetica", "normal");

  // Fundo preto
  doc.setFillColor(INK);
  doc.rect(0, 0, W, H, "F");

  // Faixa dourada superior
  doc.setFillColor(GOLD);
  doc.rect(0, 0, W, 1.5, "F");

  let y = 9;

  // helpers
  const setColor = (hex: string) => doc.setTextColor(hex);
  const txt = (
    s: string,
    x: number,
    yy: number,
    opts?: { align?: "left" | "right" | "center" },
  ) => doc.text(s, x, yy, opts);

  const wrap = (s: string, w: number) => doc.splitTextToSize(s, w) as string[];

  // Tag superior
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setColor(GOLD);
  txt("Tales Medeiros Consultor - Fluxo de Pagamento", M, y);
  y += 6;

  // Título empreendimento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  setColor(WHITE);
  const titleLines = wrap(input.empreendimento || "Empreendimento", CW);
  titleLines.forEach((line) => {
    txt(line, M, y);
    y += 5.5;
  });
  y += 0.5;

  // Unidade
  if (input.unidade) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setColor(TEXT_SOFT);
    txt(input.unidade, M, y);
    y += 4;
  }

  // Tipologia
  if (input.tipologia) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(TEXT_SOFT);
    const tipo = wrap(input.tipologia, CW);
    tipo.forEach((line) => {
      txt(line, M, y);
      y += 3.6;
    });
  }

  // Entrega
  if (input.entrega) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    setColor(GOLD_SOFT);
    txt(`Entrega: ${input.entrega}`, M, y + 1);
    y += 5;
  }

  y += 2;

  // Linha divisória
  doc.setDrawColor(70, 70, 70);
  doc.setLineWidth(0.2);
  doc.line(M, y, W - M, y);
  y += 5;

  // Preço tabela (riscado)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setColor(MUTED);
  txt("PREÇO TABELA", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor("#bdbdbd");
  const vtTxt = formatBRL(input.vt);
  txt(vtTxt, W - M, y, { align: "right" });
  // strike-through
  const vtW = doc.getTextWidth(vtTxt);
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.3);
  doc.line(W - M - vtW, y - 1, W - M, y - 1);
  y += 6;

  // Nossa negociação
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setColor(GOLD);
  txt("NOSSA NEGOCIAÇÃO", M, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setColor(WHITE);
  txt(formatBRL(input.vv), M, y);
  y += 4;

  // Economia
  const economia = input.vt - input.vv;
  if (economia > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setColor(GOLD_SOFT);
    txt(`Economia de ${formatBRL(economia)}`, M, y + 2);
    y += 5;
  }

  y += 3;

  // Linha
  doc.setDrawColor(70, 70, 70);
  doc.setLineWidth(0.2);
  doc.line(M, y, W - M, y);
  y += 6;

  // Helper para fase
  const phaseTitle = (num: string, title: string) => {
    // chip dourado
    doc.setFillColor(GOLD);
    doc.rect(M, y - 3.2, 4.5, 4.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setColor(INK);
    txt(num, M + 2.25, y, { align: "center" });
    setColor(WHITE);
    doc.setFontSize(8.5);
    txt(title.toUpperCase(), M + 6.5, y);
    y += 5.5;
  };

  const subRow = (label: string, value: string, note?: string, note2?: string) => {
    // Label + valor na mesma linha
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setColor(TEXT_SOFT);
    txt(label, M + 2, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setColor(WHITE);
    txt(value, W - M, y, { align: "right" });
    y += 3.8;

    if (note) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      setColor(GOLD_SOFT);
      txt(note, W - M, y, { align: "right" });
      y += 3;
    }
    if (note2) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.8);
      setColor(MUTED);
      txt(note2, W - M, y, { align: "right" });
      y += 2.8;
    }
    y += 2.2;
  };

  // Fase 1 — Entrada (parcela em destaque, total e qtd menores)
  phaseTitle("1", "Entrada");
  const saParcela = input.saParcelas > 0 ? c.sa / input.saParcelas : 0;
  const psParcela = input.psParcelas > 0 ? c.ps / input.psParcelas : 0;

  const entradaRow = (
    label: string,
    parcelas: number,
    parcela: number,
    total: number,
    via: string,
    parcelaCorrigida?: number,
  ) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setColor(TEXT_SOFT);
    txt(label, M + 2, y + 1);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    setColor(WHITE);
    txt(parcela > 0 ? formatBRL(parcela) : "—", W - M, y + 1.5, { align: "right" });
    y += 5.5;

    if (parcelaCorrigida !== undefined && parcelaCorrigida > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.2);
      setColor(GOLD_SOFT);
      txt(`corrigida ~ ${formatBRL(parcelaCorrigida)}`, W - M, y, { align: "right" });
      y += 3;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    setColor(GOLD_SOFT);
    txt(`${parcelas}x ${via}`, W - M, y, { align: "right" });
    y += 3.2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    setColor(MUTED);
    txt(`total ${formatBRL(total)}`, W - M, y, { align: "right" });
    y += 5;
  };

  entradaRow("Sinal ato", input.saParcelas, saParcela, c.sa, "no cartão");
  if (c.ec > 0) {
    const ecN = Math.max(1, input.ecParcelas || 1);
    entradaRow("Entrada Cliente", ecN, c.ec / ecN, c.ec, ecN === 1 ? "à vista" : "no boleto");
  }
  const psCorrigida = proSolutoParcelaCorrigida(c.ps, input.psParcelas);
  entradaRow("Pró-soluto", input.psParcelas, psParcela, c.ps, "boleto c/ correção", psCorrigida);
  y += 1;

  // Fase 2 — Seguro (gráfico de evolução)
  phaseTitle("2", "Seguro de Obra");
  const mesesObra = tempoObraMeses(input.entrega);
  const evo = seguroEvolucao(
    input.seguroInicial,
    input.seguroFinal,
    mesesObra,
    input.seguroMarcos,
  );

  if (evo.length >= 2) {
    // Legenda
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    setColor(TEXT_SOFT);
    txt("Evolui junto com a obra", M + 2, y);
    y += 3.5;

    // Gráfico de barras
    const chartH = 14;
    const chartW = CW - 4;
    const x0 = M + 2;
    const y0 = y;
    const max = evo[evo.length - 1].valor;
    const gap = 0.8;
    const barW = (chartW - gap * (evo.length - 1)) / evo.length;

    evo.forEach((p, i) => {
      const h = Math.max(0.8, (p.valor / max) * chartH);
      const bx = x0 + i * (barW + gap);
      const by = y0 + (chartH - h);
      // cor: último em dourado pleno, demais em dourado suave
      if (i === evo.length - 1) doc.setFillColor(GOLD);
      else doc.setFillColor(GOLD_SOFT);
      doc.rect(bx, by, barW, h, "F");
    });

    // Linha de base
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.15);
    doc.line(x0, y0 + chartH, x0 + chartW, y0 + chartH);
    y = y0 + chartH + 3;

    // Rótulos extremos
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    setColor(MUTED);
    txt(`±${formatBRLCompact(input.seguroInicial)} · hoje`, M + 2, y);
    txt(`±${formatBRLCompact(input.seguroFinal)} · entrega`, W - M, y, { align: "right" });
    y += 3;

    if (mesesObra > 0 && input.seguroFinal > 0) {
      const mediaParcela = evo.reduce((s, p) => s + p.valor, 0) / evo.length;
      doc.setFontSize(6.2);
      setColor(GOLD_SOFT);
      txt(
        `média ±${formatBRLCompact(mediaParcela)}/mês · ${mesesObra} meses`,
        W - M,
        y,
        { align: "right" },
      );
      y += 3;
    }
  } else {
    subRow("Inicial", formatBRLCompact(input.seguroInicial));
    subRow("Final (~)", formatBRLCompact(input.seguroFinal));
  }
  y += 3;

  // Fase 3 — Pós-obra
  phaseTitle("3", "Pós-obra");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setColor(TEXT_SOFT);
  const posTxt = wrap(
    `Financiamento direto com o banco, a partir de ${input.posObraInicio || "(definir)"}.`,
    CW - 2,
  );
  posTxt.forEach((line) => {
    txt(line, M + 2, y);
    y += 3.6;
  });
  y += 5;

  if (c.vf > 0 && input.posObraPrazoMeses > 0) {
    const posParc = parcelaPricePosObra(c.vf, input.posObraPrazoMeses, input.posObraJurosAA);
    const anos = Math.round(input.posObraPrazoMeses / 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setColor(TEXT_SOFT);
    txt("Parcela estimada", M + 2, y);
    y += 4.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setColor(WHITE);
    txt(formatBRL(posParc), W - M, y, { align: "right" });
    y += 3.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    setColor(GOLD_SOFT);
    txt(
      `${input.posObraPrazoMeses}x (${anos} anos) · ${input.posObraJurosAA.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% a.a. PRICE`,
      W - M,
      y,
      { align: "right" },
    );
    y += 3.2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    setColor(MUTED);
    txt(`Valor financiado ${formatBRL(c.vf)}`, W - M, y, { align: "right" });
    y += 4;
  }

  // Rodapé creme — fixo no fim, com altura segura
  const footerH = 22;
  const footerY = H - footerH;

  doc.setFillColor(CREAM);
  doc.rect(0, footerY, W, footerH, "F");
  doc.setFillColor(GOLD);
  doc.rect(0, footerY, W, 0.7, "F");

  // Disclaimer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.6);
  setColor("#5a5a5a");
  const disc = wrap(
    "Esta é uma simulação genérica. Valores e condições sujeitos à análise de crédito e confirmação pela construtora. Validade: 7 dias.",
    CW,
  );
  let fy = footerY + 4;
  disc.forEach((line) => {
    txt(line, W / 2, fy, { align: "center" });
    fy += 2.6;
  });

  // Assinatura
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.6);
  setColor(GOLD);
  const footerLines = wrap(
    `Tales Medeiros Consultor Imobiliário. Todos os Direitos Reservados. ${todayBR()}. Belo Horizonte, MG`,
    CW,
  );
  fy += 1;
  footerLines.forEach((line) => {
    txt(line, W / 2, fy, { align: "center" });
    fy += 2.6;
  });

  return doc;
}

/**
 * PDF da Tabela Direta — estrutura simples: VT, entrada, obra (mensais +
 * intermediárias), pós-obra (60% em 120x direto com a construtora).
 */
function generateTabelaDiretaPDF(input: ProposalInput): jsPDF {
  const W = 90;
  const H = 210;
  const M = 8;
  const CW = W - M * 2;
  const doc = new jsPDF({ unit: "mm", format: [W, H], orientation: "portrait" });
  const td = computeTabelaDireta(input);

  doc.setFont("helvetica", "normal");
  doc.setFillColor(INK);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(GOLD);
  doc.rect(0, 0, W, 1.5, "F");

  let y = 9;
  const setColor = (hex: string) => doc.setTextColor(hex);
  const txt = (
    s: string,
    x: number,
    yy: number,
    opts?: { align?: "left" | "right" | "center" },
  ) => doc.text(s, x, yy, opts);
  const wrap = (s: string, w: number) => doc.splitTextToSize(s, w) as string[];

  // Tag superior
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setColor(GOLD);
  txt("Tales Medeiros Consultor - Tabela Direta", M, y);
  y += 6;

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  setColor(WHITE);
  wrap(input.empreendimento || "Empreendimento", CW).forEach((line) => {
    txt(line, M, y);
    y += 5.5;
  });
  y += 0.5;

  if (input.unidade) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setColor(TEXT_SOFT);
    txt(input.unidade, M, y);
    y += 4;
  }
  if (input.tipologia) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(TEXT_SOFT);
    wrap(input.tipologia, CW).forEach((line) => {
      txt(line, M, y);
      y += 3.6;
    });
  }
  if (input.entrega) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    setColor(GOLD_SOFT);
    txt(`Entrega: ${input.entrega}`, M, y + 1);
    y += 5;
  }
  y += 2;

  // Divisor
  doc.setDrawColor(70, 70, 70);
  doc.setLineWidth(0.2);
  doc.line(M, y, W - M, y);
  y += 5;

  // Modalidade + Valor de Tabela
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setColor(GOLD);
  txt("MODALIDADE TABELA DIRETA", M, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setColor(MUTED);
  txt("VALOR DE TABELA", M, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setColor(WHITE);
  txt(formatBRL(input.vt), M, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  setColor(GOLD_SOFT);
  txt("Tudo direto com a construtora · sem banco", M, y + 2);
  y += 6;

  doc.setDrawColor(70, 70, 70);
  doc.setLineWidth(0.2);
  doc.line(M, y, W - M, y);
  y += 6;

  // Helper para chip de fase
  const phaseTitle = (num: string, title: string) => {
    doc.setFillColor(GOLD);
    doc.rect(M, y - 3.2, 4.5, 4.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setColor(INK);
    txt(num, M + 2.25, y, { align: "center" });
    setColor(WHITE);
    doc.setFontSize(8.5);
    txt(title.toUpperCase(), M + 6.5, y);
    y += 5.5;
  };

  // ── Fase 1: Entrada (10% VT) = S.A + E.C
  phaseTitle("1", "Entrada · 10% VV");
  const c = compute(input);

  // S.A
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setColor(TEXT_SOFT);
  txt("Sinal ato", M + 2, y + 1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setColor(WHITE);
  const saParcela = input.saParcelas > 0 ? c.sa / input.saParcelas : c.sa;
  txt(formatBRL(saParcela), W - M, y + 1.5, { align: "right" });
  y += 5.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  setColor(GOLD_SOFT);
  txt(`${input.saParcelas}x no cartão · total ${formatBRL(c.sa)}`, W - M, y, { align: "right" });
  y += 5;

  // E.C (se houver)
  if (c.ec > 0) {
    const ecN = Math.max(1, input.ecParcelas || 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setColor(TEXT_SOFT);
    txt("Entrada cliente", M + 2, y + 1);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    setColor(WHITE);
    txt(formatBRL(c.ec / ecN), W - M, y + 1.5, { align: "right" });
    y += 5.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    setColor(GOLD_SOFT);
    txt(
      `${ecN === 1 ? "à vista" : `${ecN}x no boleto`} · total ${formatBRL(c.ec)}`,
      W - M,
      y,
      { align: "right" },
    );
    y += 5;
  }

  // ── Fase 2: Obra
  phaseTitle("2", "Obra · 30% VV");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setColor(TEXT_SOFT);
  txt("Parcela mensal", M + 2, y + 1);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setColor(WHITE);
  txt(td.obraMensalParcela > 0 ? formatBRL(td.obraMensalParcela) : "—", W - M, y + 1.5, { align: "right" });
  y += 5.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  setColor(GOLD_SOFT);
  txt(`${td.mesesObra}x · direto com a construtora`, W - M, y, { align: "right" });
  y += 3.2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  setColor(MUTED);
  txt(`total mensais ${formatBRL(td.obraMensalTotal)}`, W - M, y, { align: "right" });
  y += 5;

  if (td.intermediariasQtd > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setColor(TEXT_SOFT);
    txt("Intermediárias anuais", M + 2, y + 1);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    setColor(WHITE);
    txt(formatBRL(td.intermediariaValor), W - M, y + 1.5, { align: "right" });
    y += 5.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    setColor(GOLD_SOFT);
    txt(`${td.intermediariasQtd}x · 5% VT cada · até a entrega`, W - M, y, { align: "right" });
    y += 3.2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    setColor(MUTED);
    txt(`total ${formatBRL(td.intermediariasTotal)}`, W - M, y, { align: "right" });
    y += 5;
  }

  // ── Fase 3: Pós-obra
  phaseTitle("3", `Pós-obra · 60% VV em ${TD_POS_OBRA_PARCELAS}x`);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setColor(TEXT_SOFT);
  wrap(
    `Direto com a construtora, a partir de ${input.posObraInicio || "(definir)"}.`,
    CW - 2,
  ).forEach((line) => {
    txt(line, M + 2, y);
    y += 3.6;
  });
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setColor(TEXT_SOFT);
  txt("Parcela estimada", M + 2, y);
  y += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setColor(WHITE);
  txt(td.posObraParcela > 0 ? formatBRL(td.posObraParcela) : "—", W - M, y, { align: "right" });
  y += 3.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  setColor(GOLD_SOFT);
  txt(
    `${TD_POS_OBRA_PARCELAS}x · ${input.posObraJurosAA.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% a.a. PRICE`,
    W - M,
    y,
    { align: "right" },
  );
  y += 3.2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  setColor(MUTED);
  txt(`Saldo financiado ${formatBRL(td.posObraTotal)}`, W - M, y, { align: "right" });
  y += 4;

  // Rodapé
  const footerH = 22;
  const footerY = H - footerH;
  doc.setFillColor(CREAM);
  doc.rect(0, footerY, W, footerH, "F");
  doc.setFillColor(GOLD);
  doc.rect(0, footerY, W, 0.7, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.6);
  setColor("#5a5a5a");
  const disc = wrap(
    "Esta é uma simulação genérica. Valores e condições sujeitos à análise de crédito e confirmação pela construtora. Validade: 7 dias.",
    CW,
  );
  let fy = footerY + 4;
  disc.forEach((line) => {
    txt(line, W / 2, fy, { align: "center" });
    fy += 2.6;
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.6);
  setColor(GOLD);
  const footerLines = wrap(
    `Tales Medeiros Consultor Imobiliário. Todos os Direitos Reservados. ${todayBR()}. Belo Horizonte, MG`,
    CW,
  );
  fy += 1;
  footerLines.forEach((line) => {
    txt(line, W / 2, fy, { align: "center" });
    fy += 2.6;
  });

  return doc;
}
