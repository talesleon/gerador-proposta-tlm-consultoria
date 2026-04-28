import { jsPDF } from "jspdf";
import {
  formatBRL,
  formatBRLCompact,
  todayBR,
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
  const W = 90;
  const H = 180;
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
  txt("TLM · PROPOSTA COMERCIAL", M, y);
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

  // Fase 1 — Entrada
  phaseTitle("1", "Entrada");
  const saParcela = input.saParcelas > 0 ? c.sa / input.saParcelas : 0;
  const psParcela = input.psParcelas > 0 ? c.ps / input.psParcelas : 0;
  subRow(
    "Sinal ato",
    formatBRL(c.sa),
    `até ${input.saParcelas}x no cartão`,
    saParcela > 0 ? `≈ ${formatBRL(saParcela)} / mês` : undefined,
  );
  subRow(
    "Pró-soluto",
    formatBRL(c.ps),
    `até ${input.psParcelas}x boleto c/ correção`,
    psParcela > 0 ? `≈ ${formatBRL(psParcela)} / mês` : undefined,
  );
  y += 1;

  // Fase 2 — Seguro
  phaseTitle("2", "Seguro de Obra");
  subRow("Inicial", formatBRLCompact(input.seguroInicial));
  subRow("Final (≈)", formatBRLCompact(input.seguroFinal));
  y += 1;

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

  // Rodapé creme — fixo no fim, com altura segura
  const footerH = 16;
  const footerY = H - footerH;

  doc.setFillColor(CREAM);
  doc.rect(0, footerY, W, footerH, "F");
  doc.setFillColor(GOLD);
  doc.rect(0, footerY, W, 0.7, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  setColor("#5a5a5a");
  const disc = wrap(
    "Valores e condições sujeitos à análise de crédito e confirmação pela construtora. Validade: 7 dias.",
    CW,
  );
  let fy = footerY + 4;
  disc.forEach((line) => {
    txt(line, M, fy);
    fy += 2.6;
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  setColor(GOLD);
  txt(
    `TLM · ${input.builder.toUpperCase()} · ${todayBR()}`,
    M,
    footerY + footerH - 2.5,
  );

  return doc;
}
