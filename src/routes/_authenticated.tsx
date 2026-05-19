import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { session, loading, signOut, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/login" });
    }
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link to="/" className="text-sm font-medium">
            Gerador de Propostas
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/minha-conta">
              <Button variant="ghost" size="sm" className="gap-2">
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.email}</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
