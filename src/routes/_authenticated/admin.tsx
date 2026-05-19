import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  checkAdminStatus,
  claimFirstAdmin,
  listConsultores,
  createConsultor,
  deleteConsultor,
  setSuspended,
  setAdminRole,
  resetUserPassword,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, ShieldAlert, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const fnStatus = useServerFn(checkAdminStatus);
  const fnClaim = useServerFn(claimFirstAdmin);

  const status = useQuery({
    queryKey: ["admin-status"],
    queryFn: () => fnStatus(),
  });

  const claim = useMutation({
    mutationFn: () => fnClaim({}),
    onSuccess: () => {
      toast.success("Você agora é administrador.");
      status.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (status.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (status.data && !status.data.isAdmin) {
    if (status.data.adminCount === 0) {
      return (
        <div className="max-w-xl mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Configuração inicial</CardTitle>
              <CardDescription>
                Ainda não existe nenhum administrador no sistema. Como você é o
                primeiro usuário, pode reivindicar o acesso de administrador agora.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => claim.mutate()} disabled={claim.isPending}>
                {claim.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Tornar-me administrador
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Acesso negado
            </CardTitle>
            <CardDescription>
              Esta área é restrita aos administradores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate({ to: "/" })}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminDashboard currentUserId={status.data!.userId} />;
}

function AdminDashboard({ currentUserId }: { currentUserId: string }) {
  const qc = useQueryClient();
  const fnList = useServerFn(listConsultores);
  const fnCreate = useServerFn(createConsultor);
  const fnDelete = useServerFn(deleteConsultor);
  const fnSuspend = useServerFn(setSuspended);
  const fnRole = useServerFn(setAdminRole);
  const fnReset = useServerFn(resetUserPassword);

  const list = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fnList(),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-users"] });

  const createMut = useMutation({
    mutationFn: (data: {
      email: string;
      password: string;
      nome: string;
      creci?: string;
      telefone?: string;
      makeAdmin: boolean;
    }) => fnCreate({ data }),
    onSuccess: () => {
      toast.success("Usuário criado.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (userId: string) => fnDelete({ data: { userId } }),
    onSuccess: () => {
      toast.success("Usuário excluído.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const suspendMut = useMutation({
    mutationFn: (vars: { userId: string; suspend: boolean }) =>
      fnSuspend({ data: vars }),
    onSuccess: (_d, v) => {
      toast.success(v.suspend ? "Acesso suspenso." : "Acesso reativado.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMut = useMutation({
    mutationFn: (vars: { userId: string; makeAdmin: boolean }) =>
      fnRole({ data: vars }),
    onSuccess: () => {
      toast.success("Permissões atualizadas.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetMut = useMutation({
    mutationFn: (vars: { userId: string; password: string }) =>
      fnReset({ data: vars }),
    onSuccess: () => toast.success("Senha redefinida."),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Administração</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os consultores que têm acesso ao sistema.
          </p>
        </div>
        <CreateUserDialog
          onSubmit={(d) => createMut.mutateAsync(d)}
          loading={createMut.isPending}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {list.isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome / Email</TableHead>
                  <TableHead>CRECI</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(list.data ?? []).map((u) => {
                  const isAdmin = u.roles.includes("admin");
                  const isSuspended =
                    u.banned_until && new Date(u.banned_until) > new Date();
                  const isSelf = u.id === currentUserId;
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium">
                          {u.profile?.nome || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {u.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {u.profile?.creci || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {u.last_sign_in_at
                          ? new Date(u.last_sign_in_at).toLocaleString("pt-BR")
                          : "Nunca"}
                      </TableCell>
                      <TableCell className="space-x-1">
                        {isAdmin && <Badge>Admin</Badge>}
                        {isSuspended ? (
                          <Badge variant="destructive">Suspenso</Badge>
                        ) : (
                          <Badge variant="secondary">Ativo</Badge>
                        )}
                        {isSelf && <Badge variant="outline">Você</Badge>}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isSelf && (
                              <DropdownMenuItem
                                onClick={() =>
                                  suspendMut.mutate({
                                    userId: u.id,
                                    suspend: !isSuspended,
                                  })
                                }
                              >
                                {isSuspended ? "Reativar acesso" : "Suspender acesso"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                roleMut.mutate({
                                  userId: u.id,
                                  makeAdmin: !isAdmin,
                                })
                              }
                              disabled={isSelf && isAdmin}
                            >
                              {isAdmin ? "Remover admin" : "Tornar admin"}
                            </DropdownMenuItem>
                            <ResetPasswordItem
                              onSubmit={(password) =>
                                resetMut.mutateAsync({ userId: u.id, password })
                              }
                            />
                            <DropdownMenuSeparator />
                            <DeleteUserItem
                              disabled={isSelf}
                              email={u.email}
                              onConfirm={() => deleteMut.mutate(u.id)}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="text-sm">
        <Link to="/" className="text-muted-foreground hover:underline">
          ← Voltar para o gerador
        </Link>
      </div>
    </div>
  );
}

function CreateUserDialog({
  onSubmit,
  loading,
}: {
  onSubmit: (d: {
    email: string;
    password: string;
    nome: string;
    creci?: string;
    telefone?: string;
    makeAdmin: boolean;
  }) => Promise<unknown>;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    creci: "",
    telefone: "",
    makeAdmin: false,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Novo consultor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar novo consultor</DialogTitle>
          <DialogDescription>
            O usuário será criado já confirmado e poderá entrar imediatamente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Senha inicial (mín. 8)</Label>
            <Input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CRECI</Label>
              <Input
                value={form.creci}
                onChange={(e) => setForm({ ...form, creci: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.makeAdmin}
              onCheckedChange={(v) => setForm({ ...form, makeAdmin: !!v })}
            />
            Tornar administrador
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={loading || !form.email || !form.password || !form.nome}
            onClick={async () => {
              try {
                await onSubmit({
                  nome: form.nome,
                  email: form.email,
                  password: form.password,
                  creci: form.creci || undefined,
                  telefone: form.telefone || undefined,
                  makeAdmin: form.makeAdmin,
                });
                setOpen(false);
                setForm({
                  nome: "",
                  email: "",
                  password: "",
                  creci: "",
                  telefone: "",
                  makeAdmin: false,
                });
              } catch {
                /* toast already shown */
              }
            }}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordItem({
  onSubmit,
}: {
  onSubmit: (password: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Redefinir senha
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
          <DialogDescription>
            Defina uma nova senha temporária para o usuário.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Nova senha (mín. 8)"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            disabled={pw.length < 8}
            onClick={async () => {
              await onSubmit(pw);
              setPw("");
              setOpen(false);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserItem({
  disabled,
  email,
  onConfirm,
}: {
  disabled: boolean;
  email: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          disabled={disabled}
          className="text-destructive focus:text-destructive"
        >
          Excluir usuário
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {email}?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é permanente. O usuário e todos os dados de perfil serão removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
