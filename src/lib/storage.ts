// Persistência local de propostas (localStorage).
// SKU sequencial — números de propostas excluídas NÃO são reutilizados.

import type { ProposalInput } from "./proposal";

const KEY = "tlm.proposals.v1";
const SEQ_KEY = "tlm.proposals.seq.v1";

export type ProposalStatus = "active" | "cancelled";

export interface SavedProposal {
  id: string; // uuid interno
  sku: string; // identificador exibido (TLM-2026-0001)
  status: ProposalStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  input: ProposalInput;
}

function read(): SavedProposal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedProposal[]) : [];
  } catch {
    return [];
  }
}

function write(list: SavedProposal[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function nextSku(): string {
  const cur = Number(localStorage.getItem(SEQ_KEY) ?? "0") + 1;
  localStorage.setItem(SEQ_KEY, String(cur));
  const year = new Date().getFullYear();
  return `TLM-${year}-${String(cur).padStart(4, "0")}`;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listProposals(): SavedProposal[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function searchProposals(query: string): SavedProposal[] {
  const q = query.trim().toLowerCase();
  if (!q) return listProposals();
  const digits = q.replace(/\D/g, "");
  return listProposals().filter((p) => {
    if (p.sku.toLowerCase().includes(q)) return true;
    const phone = (p.input.clienteTelefone || "").replace(/\D/g, "");
    if (digits && phone.includes(digits)) return true;
    if ((p.input.clienteNome || "").toLowerCase().includes(q)) return true;
    return false;
  });
}

export function createProposal(input: ProposalInput): SavedProposal {
  const now = new Date().toISOString();
  const item: SavedProposal = {
    id: uuid(),
    sku: nextSku(),
    status: "active",
    createdAt: now,
    updatedAt: now,
    input,
  };
  write([item, ...read()]);
  return item;
}

export function updateProposal(id: string, input: ProposalInput): SavedProposal | null {
  const list = read();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], input, updatedAt: new Date().toISOString() };
  write(list);
  return list[idx];
}

/**
 * Inutiliza a proposta: marca como `cancelled` e mantém o registro
 * (o número/SKU não é reaproveitado pela sequência).
 */
export function cancelProposal(id: string): void {
  const list = read();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return;
  list[idx] = {
    ...list[idx],
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  };
  write(list);
}

export function getProposal(id: string): SavedProposal | undefined {
  return read().find((p) => p.id === id);
}
