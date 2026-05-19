import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  component: MinhaContaPage,
  head: () => ({ meta: [{ title: "Minha Conta — Gerador de Propostas" }] }),
});

interface ProfileForm {
  nome: string;
  creci: string;
  telefone: string;
  cidade: string;
  uf: string;
  cor_primaria: string;
  assinatura_rodape: string;
}

const EMPTY: ProfileForm = {
  nome: "",
  creci: "",
  telefone: "",
  cidade: "",
  uf: "",
  cor_primaria: "",
  assinatura_rodape: "",
};

function MinhaContaPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nome, creci, telefone, cidade, uf, cor_primaria, assinatura_rodape")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setForm({
          nome: data.nome ?? "",
          creci: data.creci ?? "",
          telefone: data.telefone ?? "",
          cidade: data.cidade ?? "",
          uf: data.uf ?? "",
          cor_primaria: data.cor_primaria ?? "",
          assinatura_rodape: data.assinatura_rodape ?? "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        nome: form.nome,
        creci: form.creci || null,
        telefone: form.telefone || null,
        cidade: form.cidade || null,
        uf: form.uf || null,
        cor_primaria: form.cor_primaria || null,
        assinatura_rodape: form.assinatura_rodape || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Perfil atualizado");
  }

  async function handleLogout() {
    await signOut();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Toaster richColors position="top-center" />
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao gerador
          </Link>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-semibold mb-1">Minha conta</h1>
          <p className="text-sm text-muted-foreground mb-6">{user?.email}</p>

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do consultor *</Label>
                <Input
                  id="nome"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="creci">CRECI</Label>
                  <Input
                    id="creci"
                    value={form.creci}
                    onChange={(e) => setForm({ ...form, creci: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_80px] gap-3">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="uf">UF</Label>
                  <Input
                    id="uf"
                    maxLength={2}
                    value={form.uf}
                    onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cor">Cor primária (hex) — opcional</Label>
                <Input
                  id="cor"
                  placeholder="#c9a84c"
                  value={form.cor_primaria}
                  onChange={(e) => setForm({ ...form, cor_primaria: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="rodape">Assinatura de rodapé</Label>
                <Textarea
                  id="rodape"
                  rows={2}
                  placeholder="Ex: Nome Consultor Imobiliário. Todos os Direitos Reservados."
                  value={form.assinatura_rodape}
                  onChange={(e) => setForm({ ...form, assinatura_rodape: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button type="button" variant="outline" onClick={handleLogout}>
                  Sair
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando…" : "Salvar"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
