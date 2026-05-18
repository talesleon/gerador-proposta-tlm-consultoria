import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  buildWhatsAppText,
  compute,
  formatBRL,
  formatBRLCompact,
  MAX_PS_PARCELAS,
  normalizeWhatsAppPhone,
  parseBRLInput,
  proSolutoParcelaCorrigida,
  seguroEvolucao,
  tempoObraMeses,
  todayBR,
  type Builder,
  type ProposalInput,
} from "@/lib/proposal";
import { generateProposalPDF } from "@/lib/pdf";
import {
  cancelProposal,
  createProposal,
  listProposals,
  searchProposals,
  updateProposal,
  type SavedProposal,
} from "@/lib/storage";
import {
  Copy,
  Download,
  RotateCcw,
  Building2,
  Calculator,
  FileText,
  Share2,
  User,
  Save,
  Plus,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Gerador de Proposta — Tales Medeiros Consultoria Imobiliária" },
      {
        name: "description",
        content:
          "Gere propostas comerciais de imóveis Riva e Direcional com fluxo de pagamento transparente e exporte como PDF ou texto para WhatsApp.",
      },
    ],
  }),
});

const DEFAULT: ProposalInput = {
  builder: "Direcional",
  clienteNome: "",
  clienteTelefone: "",
  empreendimento: "",
  unidade: "",
  tipologia: "",
  entrega: "",
  vt: 0,
  vv: 0,
  va: 0,
  saOverride: null,
  ec: 0,
  saParcelas: 12,
  psParcelas: 84,
  seguroInicial: 0,
  seguroFinal: 0,
  seguroMarcos: 0,
  posObraInicio: "",
};

function Index() {
  const [input, setInput] = useState<ProposalInput>(DEFAULT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [proposals, setProposals] = useState<SavedProposal[]>([]);

  const c = useMemo(() => compute(input), [input]);
  const text = useMemo(() => buildWhatsAppText(input, c), [input, c]);

  useEffect(() => {
    setProposals(listProposals());
  }, []);

  const refresh = () => setProposals(listProposals());
  const filtered = useMemo(() => searchProposals(query), [query, proposals]);

  const set = <K extends keyof ProposalInput>(k: K, v: ProposalInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const setBuilder = (b: Builder) => {
    setInput((p) => ({
      ...p,
      builder: b,
      psParcelas: Math.min(p.psParcelas, MAX_PS_PARCELAS[b]),
    }));
  };

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Texto copiado!", { description: "Cole no WhatsApp do cliente." });
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  function handleShareWhatsApp() {
    const phone = normalizeWhatsAppPhone(input.clienteTelefone);
    const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
    const url = `${base}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleDownloadPDF() {
    const doc = generateProposalPDF(input, c);
    const safe = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
    const prefix = editingSku ? `${editingSku}_` : "";
    doc.save(`${prefix}Proposta_${safe(input.empreendimento)}_${safe(input.unidade)}.pdf`);
    toast.success("PDF gerado!");
  }

  function handleSaveProposal() {
    if (editingId) {
      const upd = updateProposal(editingId, input);
      if (upd) {
        toast.success(`Proposta ${upd.sku} atualizada`);
        refresh();
      }
    } else {
      const created = createProposal(input);
      setEditingId(created.id);
      setEditingSku(created.sku);
      toast.success(`Proposta ${created.sku} gerada`);
      refresh();
    }
  }

  function handleNewProposal() {
    setInput(DEFAULT);
    setEditingId(null);
    setEditingSku(null);
    toast.info("Nova proposta");
  }

  function handleEditProposal(p: SavedProposal) {
    setInput(p.input);
    setEditingId(p.id);
    setEditingSku(p.sku);
    toast.info(`Editando ${p.sku}`);
  }

  function handleDeleteProposal(p: SavedProposal) {
    if (!confirm(`Excluir/inutilizar proposta ${p.sku}? O número não será reaproveitado.`)) return;
    cancelProposal(p.id);
    if (editingId === p.id) handleNewProposal();
    refresh();
    toast.success(`Proposta ${p.sku} inutilizada`);
  }

  const psMax = MAX_PS_PARCELAS[input.builder];
  const psOver = input.psParcelas > psMax;
  const saOverflow = c.sa > c.ve;
  const vvOverVt = input.vv > input.vt && input.vt > 0;

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />

      {/* App bar Material */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur elev-1">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{ background: "var(--ink)" }}
          >
            <Building2 className="h-5 w-5" style={{ color: "var(--gold)" }} />
          </div>
          <div className="flex-1 min-w-[140px]">
            <h1 className="text-lg font-bold leading-tight text-foreground truncate">
              Gerador de Proposta
              {editingSku && (
                <span className="ml-2 text-xs font-mono text-primary">{editingSku}</span>
              )}
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Tales Medeiros Consultoria Imobiliária
            </p>
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-md order-3 sm:order-2">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nº da proposta ou telefone…"
              className="pl-8 h-9"
            />
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex order-2 sm:order-3">
            {input.builder}
          </Badge>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        {/* ─────────── FORMULÁRIO ─────────── */}
        <section className="space-y-5">
          {/* Cliente */}
          <Card className="elev-1 p-5">
            <SectionHead icon={<User className="h-4 w-4" />} title="Cliente" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nome do cliente">
                <Input
                  value={input.clienteNome}
                  onChange={(e) => set("clienteNome", e.target.value)}
                  placeholder="Ex.: João da Silva"
                />
              </Field>
              <Field
                label="Telefone (WhatsApp)"
                helper={
                  input.clienteTelefone && !normalizeWhatsAppPhone(input.clienteTelefone)
                    ? "Telefone inválido — informe DDD + número"
                    : "Ex.: (61) 99999-9999"
                }
                warn={!!input.clienteTelefone && !normalizeWhatsAppPhone(input.clienteTelefone)}
              >
                <Input
                  inputMode="tel"
                  value={input.clienteTelefone}
                  onChange={(e) => set("clienteTelefone", e.target.value)}
                  placeholder="(61) 99999-9999"
                />
              </Field>
            </div>
          </Card>

          {/* Empreendimento */}
          <Card className="elev-1 p-5">
            <SectionHead icon={<Building2 className="h-4 w-4" />} title="Empreendimento" />
            <div className="mt-4 space-y-4">
              <Field label="Construtora">
                <div className="flex gap-2">
                  {(["Riva", "Direcional"] as Builder[]).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBuilder(b)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                        input.builder === b
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:bg-accent"
                      }`}
                    >
                      {b}
                      <span className="ml-1.5 text-[10px] opacity-70">
                        até {MAX_PS_PARCELAS[b]}x
                      </span>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Empreendimento">
                  <Input
                    value={input.empreendimento}
                    onChange={(e) => set("empreendimento", e.target.value)}
                    placeholder="Priori Residence"
                  />
                </Field>
                <Field label="Bloco / Unidade">
                  <Input
                    value={input.unidade}
                    onChange={(e) => set("unidade", e.target.value)}
                    placeholder="BL01 - 1904"
                  />
                </Field>
              </div>

              <Field label="Tipologia">
                <Input
                  value={input.tipologia}
                  onChange={(e) => set("tipologia", e.target.value)}
                  placeholder="2 quartos com suíte e varanda"
                />
              </Field>

              <Field label="Previsão de Entrega">
                <Input
                  value={input.entrega}
                  onChange={(e) => set("entrega", e.target.value)}
                  placeholder="Fev/2029"
                />
              </Field>
            </div>
          </Card>

          {/* Valores */}
          <Card className="elev-1 p-5">
            <SectionHead icon={<Calculator className="h-4 w-4" />} title="Valores" />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <MoneyField
                label="V.T — Valor Tabela"
                value={input.vt}
                onChange={(n) => set("vt", n)}
              />
              <MoneyField
                label="V.V — Valor Venda"
                value={input.vv}
                onChange={(n) => set("vv", n)}
                helper={vvOverVt ? "V.V acima do V.T" : undefined}
                warn={vvOverVt}
              />
              <MoneyField
                label="V.A — Valor Avaliação"
                value={input.va}
                onChange={(n) => set("va", n)}
              />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Computed label="V.F · Financiável (80% V.A)" value={formatBRL(c.vf)} />
              <Computed label="V.E · Entrada (V.V − V.F)" value={formatBRL(c.ve)} />
            </div>
          </Card>

          {/* Pagamento */}
          <Card className="elev-1 p-5">
            <SectionHead icon={<FileText className="h-4 w-4" />} title="Composição da entrada" />
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="S.A — Sinal Ato"
                  helper={
                    saOverflow
                      ? "S.A maior que V.E"
                      : `Padrão 2% V.V = ${formatBRL(c.saDefault)}`
                  }
                  warn={saOverflow}
                  trailing={
                    input.saOverride !== null && (
                      <button
                        type="button"
                        onClick={() => set("saOverride", null)}
                        className="text-[10px] uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" /> 2%
                      </button>
                    )
                  }
                >
                  <MoneyInput
                    value={c.sa}
                    onChange={(n) => set("saOverride", n)}
                  />
                </Field>

                <Field
                  label="Parcelas do Sinal (cartão)"
                  helper={
                    input.saParcelas > 0 && c.sa > 0
                      ? `≈ ${formatBRL(c.sa / input.saParcelas)} / mês`
                      : undefined
                  }
                >
                  <Input
                    inputMode="numeric"
                    value={String(input.saParcelas)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      const n = digits === "" ? 1 : Math.max(1, Math.min(12, Number(digits)));
                      set("saParcelas", n);
                    }}
                  />
                </Field>
              </div>

              <Field
                label="E.C — Entrada Cliente"
                helper={
                  !c.ecValid
                    ? "S.A + E.C maior que V.E"
                    : "Aceita 0. Será diminuído do P.S."
                }
                warn={!c.ecValid}
              >
                <MoneyInput value={input.ec} onChange={(n) => set("ec", n)} />
              </Field>

              <Computed label="P.S · Pró-soluto (V.E − S.A − E.C)" value={formatBRL(c.ps)} highlight />

              <Field
                label={`Parcelas do Pró-soluto (boleto) · máx ${psMax}x`}
                helper={
                  psOver
                    ? `Excede o limite da ${input.builder}`
                    : input.psParcelas > 0 && c.ps > 0
                      ? `≈ ${formatBRL(c.ps / input.psParcelas)} / mês`
                      : undefined
                }
                warn={psOver}
              >
                <Input
                  inputMode="numeric"
                  value={String(input.psParcelas)}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    const n = digits === "" ? 1 : Math.max(1, Number(digits));
                    set("psParcelas", n);
                  }}
                />
              </Field>
            </div>
          </Card>

          {/* Seguro de obra */}
          <Card className="elev-1 p-5">
            <SectionHead icon={<Calculator className="h-4 w-4" />} title="Seguro de obra & pós-obra" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <MoneyField
                label="Seguro Inicial"
                value={input.seguroInicial}
                onChange={(n) => set("seguroInicial", n)}
              />
              <MoneyField
                label="Seguro Final (≈)"
                value={input.seguroFinal}
                onChange={(n) => set("seguroFinal", n)}
              />
              <Field
                label="Marcos do gráfico (trimestres)"
                helper={
                  input.seguroMarcos === 0
                    ? `Auto: ${Math.max(2, Math.ceil(tempoObraMeses(input.entrega) / 3)) || 2} marcos`
                    : `${input.seguroMarcos} marcos no gráfico`
                }
              >
                <Input
                  inputMode="numeric"
                  value={String(input.seguroMarcos)}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    const n = digits === "" ? 0 : Math.min(12, Number(digits));
                    set("seguroMarcos", n);
                  }}
                  placeholder="0 = automático"
                />
              </Field>
              <Field label="Início do pós-obra (mês/ano)">
                <Input
                  value={input.posObraInicio}
                  onChange={(e) => set("posObraInicio", e.target.value)}
                  placeholder="março de 2029"
                />
              </Field>
            </div>
          </Card>
        </section>

        {/* ─────────── PREVIEW ─────────── */}
        <aside className="space-y-4 lg:sticky lg:top-[76px] lg:self-start">
          <ProposalPreview input={input} />

          <Card className="elev-2 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleSaveProposal} className="h-10">
                <Save className="h-4 w-4" />
                {editingId ? "Atualizar" : "Gerar proposta"}
              </Button>
              <Button onClick={handleNewProposal} variant="outline" className="h-10">
                <Plus className="h-4 w-4" />
                Nova
              </Button>
            </div>
            <Button
              onClick={handleDownloadPDF}
              className="w-full h-11 font-semibold tracking-wide"
            >
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleCopy} variant="secondary" className="h-10">
                <Copy className="h-4 w-4" />
                Copiar texto
              </Button>
              <Button onClick={handleShareWhatsApp} variant="outline" className="h-10">
                <Share2 className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-center pt-1">
              {editingSku ? `${editingSku} · ` : ""}Proposta gerada em {todayBR()}
            </p>
          </Card>

          <ProposalsList
            items={filtered}
            query={query}
            editingId={editingId}
            onEdit={handleEditProposal}
            onDelete={handleDeleteProposal}
          />
        </aside>
      </main>
    </div>
  );
}

/* ─────────── Subcomponentes ─────────── */

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
        {icon}
      </span>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h2>
    </div>
  );
}

function Field({
  label,
  children,
  helper,
  warn,
  trailing,
}: {
  label: string;
  children: React.ReactNode;
  helper?: string;
  warn?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
        {trailing}
      </div>
      {children}
      {helper && (
        <p
          className={`text-[11px] ${warn ? "text-destructive" : "text-muted-foreground"}`}
        >
          {helper}
        </p>
      )}
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  helper,
  warn,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  helper?: string;
  warn?: boolean;
}) {
  return (
    <Field label={label} helper={helper} warn={warn}>
      <MoneyInput value={value} onChange={onChange} />
    </Field>
  );
}

function MoneyInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [text, setText] = useState<string>(() => formatBRL(value));
  const [focused, setFocused] = useState(false);

  // sincroniza quando valor externo muda e o campo não está em edição
  if (!focused && parseBRLInput(text).toFixed(2) !== value.toFixed(2)) {
    // atualiza display silenciosamente
    queueMicrotask(() => setText(formatBRL(value)));
  }

  return (
    <Input
      inputMode="decimal"
      value={text}
      onFocus={() => {
        setFocused(true);
        setText(value ? String(value).replace(".", ",") : "");
      }}
      onBlur={() => {
        setFocused(false);
        const n = parseBRLInput(text);
        onChange(n);
        setText(formatBRL(n));
      }}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseBRLInput(e.target.value));
      }}
    />
  );
}

function Computed({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 ${
        highlight
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-muted/40"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}

/* ─────────── Preview da proposta (estilo PDF) ─────────── */

function ProposalPreview({ input }: { input: ProposalInput }) {
  const c = compute(input);
  return (
    <Card className="elev-3 overflow-hidden border-0 p-0">
      <div className="proposal-dark">
        <div className="h-1.5 w-full" style={{ background: "var(--gold)" }} />
        <div className="px-5 pt-5 pb-4">
          <div className="text-[9px] tracking-[3px] uppercase gold-strong">
            TLM · Proposta
          </div>
          <h3 className="text-3xl font-bold leading-tight mt-1">
            {input.empreendimento || "Empreendimento"}
          </h3>
          {input.unidade && (
            <div className="mt-2 text-[11px] tracking-widest uppercase opacity-70">
              {input.unidade}
            </div>
          )}
          {input.tipologia && (
            <div className="text-[12px] opacity-80 mt-0.5">{input.tipologia}</div>
          )}
          {input.entrega && (
            <div className="text-[11px] gold mt-1">Entrega: {input.entrega}</div>
          )}

          <Separator className="my-4 bg-white/10" />

          <div className="flex items-end justify-between">
            <div>
              <div className="text-[9px] tracking-widest uppercase opacity-50">
                Preço Tabela
              </div>
              <div className="text-base line-through opacity-60">
                {formatBRL(input.vt)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] tracking-widest uppercase gold-strong">
                Negociação
              </div>
              <div className="text-2xl font-bold">
                {formatBRL(input.vv)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.03] border-t border-white/10">
          <PreviewPhase num="1" title="Entrada">
            <PreviewEntradaRow
              label="Sinal ato"
              parcelas={input.saParcelas}
              parcela={input.saParcelas > 0 ? c.sa / input.saParcelas : 0}
              total={c.sa}
              via="no cartão"
            />
            <PreviewEntradaRow
              label="Pró-soluto"
              parcelas={input.psParcelas}
              parcela={input.psParcelas > 0 ? c.ps / input.psParcelas : 0}
              parcelaCorrigida={proSolutoParcelaCorrigida(c.ps, input.psParcelas)}
              total={c.ps}
              via="boleto c/ correção"
            />
          </PreviewPhase>
          <PreviewPhase num="2" title="Seguro de Obra">
            {(() => {
              const m = tempoObraMeses(input.entrega);
              const evo = seguroEvolucao(input.seguroInicial, input.seguroFinal, m, input.seguroMarcos);
              if (evo.length < 2) {
                return (
                  <>
                    <PreviewRow label="Inicial" value={formatBRLCompact(input.seguroInicial)} />
                    <PreviewRow label="Final (≈)" value={formatBRLCompact(input.seguroFinal)} />
                  </>
                );
              }
              const max = evo[evo.length - 1].valor;
              return (
                <div className="px-1">
                  <p className="text-[10px] opacity-80 mb-1.5">
                    Evolui junto com a obra · começa pequeno e cresce até a entrega
                  </p>
                  <div className="flex items-end gap-[3px] h-14 border-b border-white/15 pb-0.5">
                    {evo.map((p, i) => {
                      const h = Math.max(6, (p.valor / max) * 100);
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            height: `${h}%`,
                            background:
                              i === evo.length - 1
                                ? "var(--gold)"
                                : "color-mix(in oklab, var(--gold) 60%, transparent)",
                          }}
                          title={`Mês ${p.mes}: ${formatBRLCompact(p.valor)}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] opacity-70 mt-1">
                    <span>±{formatBRLCompact(input.seguroInicial)} · hoje</span>
                    <span>±{formatBRLCompact(input.seguroFinal)} · entrega</span>
                  </div>
                  {input.seguroFinal > 0 && evo.length > 0 && (
                    <p className="text-[9px] opacity-70 text-center mt-0.5">
                      média ±{formatBRLCompact(evo.reduce((s, p) => s + p.valor, 0) / evo.length)}/mês · {m} meses
                    </p>
                  )}
                </div>
              );
            })()}
          </PreviewPhase>
          <PreviewPhase num="3" title="Pós-obra">
            <p className="text-[11px] opacity-80 leading-relaxed px-1">
              Financiamento direto com o banco, a partir de{" "}
              {input.posObraInicio || "(definir)"}.
            </p>
          </PreviewPhase>
        </div>

        <div className="bg-[#f6f2eb] text-[#5a5a5a] px-5 py-3 border-t-2 border-[var(--gold)]">
          <p className="text-[10px] leading-relaxed">
            Valores e condições sujeitos à análise de crédito e confirmação pela construtora.
            Validade: 7 dias.
          </p>
          <div className="text-[9px] tracking-widest uppercase mt-2 gold-strong font-semibold">
            TLM · {input.builder} · {todayBR()}
          </div>
        </div>
      </div>
    </Card>
  );
}

function PreviewPhase({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-3 border-b border-white/10 last:border-b-0">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-flex h-4 min-w-4 px-1 items-center justify-center text-[10px] font-bold"
          style={{ background: "var(--gold)", color: "var(--ink)" }}
        >
          {num}
        </span>
        <span className="text-[10px] tracking-widest uppercase font-bold">{title}</span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  note,
  note2,
}: {
  label: string;
  value: string;
  note?: string;
  note2?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 border-b border-dashed border-white/5 last:border-b-0">
      <div className="text-[12px] opacity-80">{label}</div>
      <div className="text-right">
        <div className="text-lg font-bold leading-tight">{value}</div>
        {note && <div className="text-[9px] gold opacity-90">{note}</div>}
        {note2 && <div className="text-[9px] opacity-60">{note2}</div>}
      </div>
    </div>
  );
}

function PreviewEntradaRow({
  label,
  parcelas,
  parcela,
  parcelaCorrigida,
  total,
  via,
}: {
  label: string;
  parcelas: number;
  parcela: number;
  parcelaCorrigida?: number;
  total: number;
  via: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 border-b border-dashed border-white/5 last:border-b-0">
      <div className="text-[12px] opacity-80">{label}</div>
      <div className="text-right">
        <div className="text-2xl font-bold leading-tight">
          {parcela > 0 ? formatBRL(parcela) : "—"}
        </div>
        {parcelaCorrigida !== undefined && parcelaCorrigida > 0 && (
          <div className="text-[10px] opacity-75">
            corrigida ≈ {formatBRL(parcelaCorrigida)}
          </div>
        )}
        <div className="text-[9px] gold opacity-90">{parcelas}x {via}</div>
        <div className="text-[9px] opacity-60">total {formatBRL(total)}</div>
      </div>
    </div>
  );
}

function ProposalsList({
  items,
  query,
  editingId,
  onEdit,
  onDelete,
}: {
  items: SavedProposal[];
  query: string;
  editingId: string | null;
  onEdit: (p: SavedProposal) => void;
  onDelete: (p: SavedProposal) => void;
}) {
  return (
    <Card className="elev-1 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Propostas
        </h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          {query ? "Nenhuma proposta encontrada." : "Nenhuma proposta salva ainda."}
        </p>
      ) : (
        <ul className="space-y-2 max-h-[420px] overflow-y-auto">
          {items.map((p) => {
            const isEditing = p.id === editingId;
            const cancelled = p.status === "cancelled";
            return (
              <li
                key={p.id}
                className={`rounded-md border p-2.5 transition ${
                  isEditing
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                } ${cancelled ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-primary font-semibold">
                        {p.sku}
                      </span>
                      {cancelled && (
                        <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">
                          INUTILIZADA
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm font-medium truncate">
                      {p.input.clienteNome || "(sem cliente)"}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {p.input.empreendimento || "—"}
                      {p.input.unidade ? ` · ${p.input.unidade}` : ""}
                    </div>
                    {p.input.clienteTelefone && (
                      <div className="text-[10px] text-muted-foreground">
                        {p.input.clienteTelefone}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => onEdit(p)}
                      title="Alterar proposta"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {!cancelled && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(p)}
                        title="Excluir / inutilizar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
