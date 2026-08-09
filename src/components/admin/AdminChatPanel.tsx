import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatThread } from "@/components/ChatThread";
import { Loader2, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Thread {
  user_id: string;
  email: string | null;
  display_name: string | null;
  last_message: string | null;
  last_at: string;
  unread: number;
}

export function AdminChatPanel({ adminId }: { adminId: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("user_id,message,image_url,is_admin,read_by_admin,created_at")
      .order("created_at", { ascending: false });
    const map = new Map<string, Thread>();
    (msgs ?? []).forEach((m: any) => {
      const t = map.get(m.user_id);
      if (!t) {
        map.set(m.user_id, {
          user_id: m.user_id,
          email: null,
          display_name: null,
          last_message: m.message ?? (m.image_url ? "📷 Gambar" : ""),
          last_at: m.created_at,
          unread: !m.is_admin && !m.read_by_admin ? 1 : 0,
        });
      } else if (!m.is_admin && !m.read_by_admin) {
        t.unread += 1;
      }
    });
    const ids = Array.from(map.keys());
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id,email,display_name").in("user_id", ids);
      (profs ?? []).forEach((p: any) => {
        const t = map.get(p.user_id);
        if (t) { t.email = p.email; t.display_name = p.display_name; }
      });
    }
    setThreads(Array.from(map.values()).sort((a, b) => +new Date(b.last_at) - +new Date(a.last_at)));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-chat-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const activeThread = threads.find((t) => t.user_id === active);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-0 border rounded-xl overflow-hidden h-[70vh] min-h-[480px]">
      {/* Threads list */}
      <div className={`border-r bg-muted/20 overflow-y-auto ${active ? "hidden md:block" : "block"}`}>
        <div className="p-3 border-b sticky top-0 bg-muted/40 backdrop-blur">
          <p className="text-xs font-bold flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> Percakapan</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : threads.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-10 px-3">Belum ada chat dari user.</p>
        ) : (
          threads.map((t) => (
            <button
              key={t.user_id}
              onClick={() => setActive(t.user_id)}
              className={`w-full text-left px-3 py-2.5 border-b hover:bg-accent/40 transition-colors ${active === t.user_id ? "bg-accent/60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{t.display_name || t.email || t.user_id.slice(0, 8)}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t.last_message || "—"}</p>
                </div>
                {t.unread > 0 && (
                  <span className="text-[9px] font-bold bg-primary text-primary-foreground rounded-full h-4 min-w-4 px-1 flex items-center justify-center shrink-0">{t.unread}</span>
                )}
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5">{new Date(t.last_at).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</p>
            </button>
          ))
        )}
      </div>

      {/* Active chat */}
      <div className={`flex flex-col min-h-0 ${active ? "block" : "hidden md:flex"}`}>
        {activeThread ? (
          <>
            <div className="h-12 border-b flex items-center gap-2 px-3 shrink-0 bg-background">
              <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={() => setActive(null)}>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{activeThread.display_name || activeThread.email || "User"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{activeThread.email}</p>
              </div>
            </div>
            <ChatThread threadUserId={active!} viewerId={adminId} asAdmin className="flex-1 min-h-0" />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-6 text-center">
            Pilih percakapan di sebelah kiri untuk membalas user.
          </div>
        )}
      </div>
    </div>
  );
}
