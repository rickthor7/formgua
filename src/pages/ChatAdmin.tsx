import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { ChatThread } from "@/components/ChatThread";

export default function ChatAdmin() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <header className="h-14 border-b flex items-center justify-between px-3 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <MessageCircle className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate">Chat Admin</h1>
            <p className="text-[10px] text-muted-foreground truncate">Tanya apa saja seputar FormGua — kami balas secepatnya.</p>
          </div>
        </div>
        <ThemeToggle />
      </header>
      <ChatThread threadUserId={user.id} viewerId={user.id} asAdmin={false} className="flex-1 min-h-0" />
    </div>
  );
}
