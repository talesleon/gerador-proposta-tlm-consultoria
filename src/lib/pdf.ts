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
const MUTED = "#8a8f99";

/**
 * PDF formato vertical estreito (story-like) — fundo preto, dourado.
 * Otimizado para envio e leitura no WhatsApp em tela cheia.
 */
export function generateProposalPDF(input: ProposalInput, c: ProposalComputed): jsPDF {
  // 80mm x 160mm — proporção mobile, fica grande em 1 tela no WhatsApp
  const W = 80;
  const H = 160;
  const doc = new jsPDF({ unit: "mm", format: [W, H], orientation: "portrait" });

  const M = 7; // margem lateral

  // Fundo preto total
  doc.setFillColor(INK);
  doc.rect(0, 0, W, H, "F");

  // Faixa dourada superior
  doc.setFillColor(GOLD);
  doc.rect(0, 0, W, 1.2, "F");

  let y = 8;

  // Tag superior
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(GOLD);
  doc.text("TLM · PROPOSTA COMERCIAL", M, y);
  y += 5;

  // Empreendimento (título)
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor("#ffffff");
  const titleLines = doc.splitTextToSize(input.empreendimento || "Empreendimento", W - M * 2);
  doc.text(titleLines, M, y);
  y += titleLines.length * 6 + 1;

  // Unidade + tipologia
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor("#cfcfcf");
  if (input.unidade) {
    doc.setFont("helvetica", "bold");
    doc.text(input.unidade, M, y);
    doc.setFont("helvetica", "normal");
    y += 3.5;
  }
  if (input.tipologia) {
    const tipoLines = doc.splitTextToSize(input.tipologia, W - M * 2);
    doc.text(tipoLines, M, y);
    y += tipoLines.length * 3.2;
  }
  if (input.entrega) {
    doc.setTextColor(GOLD_SOFT);
    doc.setFontSize(7);
    doc.text(`Entrega: ${input.entrega}`, M, y + 2);
    y += 5;
  }

  // Linha
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.15);
  doc.line(M, y, W - M, y);
  y += 4;

  // Preço tabela (riscado)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(MUTED);
  doc.text("PREÇO TABELA", M, y);
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#bdbdbd");
  const vtTxt = formatBRL(input.vt);
  doc.text(vtTxt, W - M, y, { align: "right" });
  // strike-through
  const vtW = doc.getTextWidth(vtTxt);
  doc.setDrawColor(140, 140, 140);
  doc.line(W - M - vtW, y - 1, W - M, y - 1);
  y += 4;

  // Nossa negociação (destaque)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(GOLD);
  doc.text("NOSSA NEGOCIAÇÃO", M, y);
  y += 4.5;
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor("#ffffff");
  doc.text(formatBRL(input.vv), M, y);
  y += 6;

  // Bloco fases
  doc.setDrawColor(60, 60, 60);
  doc.line(M, y, W - M, y);
  y += 4;

  const phaseTitle = (num: string, title: string) => {
    doc.setFillColor(GOLD);
    doc.rect(M, y - 3, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(INK);
    doc.text(num, M + 2, y, { align: "center" });
    doc.setTextColor("#ffffff");
    doc.setFontSize(8);
    doc.text(title.toUpperCase(), M + 6, y);
    y += 4.5;
  };

  const subRow = (label: string, value: string, note?: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor("#cfcfcf");
    doc.text(label, M + 2, y);
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor("#ffffff");
    doc.text(value, W - M, y, { align: "right" });
    y += 3.2;
    if (note) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.8);
      doc.setTextColor(GOLD_SOFT);
      doc.text(note, W - M, y, { align: "right" });
      y += 3;
    }
    y += 1.5;
  };

  // Fase 1 — Entrada
  phaseTitle("1", "Entrada");
  subRow("Sinal ato", formatBRL(c.sa), `até ${input.saParcelas}x no cartão`);
  subRow(
    "Pró-soluto",
    formatBRL(c.ps),
    `até ${input.psParcelas}x boleto c/ correção`,
  );
  y += 1;

  // Fase 2 — Seguro de obra
  phaseTitle("2", "Seguro de Obra");
  subRow("Inicial", formatBRLCompact(input.seguroInicial));
  subRow("Final (≈)", formatBRLCompact(input.seguroFinal));
  y += 1;

  // Fase 3 — Pós-obra
  phaseTitle("3", "Pós-obra");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor("#cfcfcf");
  const posTxt = doc.splitTextToSize(
    `Financiamento direto com o banco, a partir de ${input.posObraInicio || "(definir)"}.`,
    W - M * 2 - 2,
  );
  doc.text(posTxt, M + 2, y);
  y += posTxt.length * 3.2 + 3;

  // Rodapé creme
  const footerH = 18;
  const footerY = H - footerH;
  doc.setFillColor(CREAM);
  doc.rect(0, footerY, W, footerH, "F");
  doc.setFillColor(GOLD);
  doc.rect(0, footerY, W, 0.6, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor("#5a5a5a");
  const disc = doc.splitTextToSize(
    "Valores e condições sujeitos à análise de crédito e confirmação pela construtora. Esta proposta tem caráter informativo e validade de 7 dias.",
    W - M * 2,
  );
  doc.text(disc, M, footerY + 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(GOLD);
  doc.text(
    `TLM · ${input.builder.toUpperCase()} · ${todayBR()}`,
    M,
    footerY + footerH - 3,
  );

  return doc;
}
