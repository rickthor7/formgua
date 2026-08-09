import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, ImagePlus, X } from "lucide-react";
import { popup } from "@/lib/swal";

interface Msg {
  id: string;
  user_id: string;
  sender_id: string;
  is_admin: boolean;
  message: string | null;
  image_url: string | null;
  created_at: string;
}

interface Props {
  /** end-user this thread belongs to */
  threadUserId: string;
  /** the currently logged-in viewer */
  viewerId: string;
  /** is the viewer the admin? */
  asAdmin: boolean;
  className?: string;
}

export function ChatThread({ threadUserId, viewerId, asAdmin, className }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  // Load + subscribe
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", threadUserId)
        .order("created_at", { ascending: true });
      if (!active) return;
      setMessages((data ?? []) as Msg[]);
      setLoading(false);
      scrollToBottom();
      // mark read
      if (asAdmin) {
        await supabase.from("chat_messages").update({ read_by_admin: true }).eq("user_id", threadUserId).eq("read_by_admin", false);
      } else {
        await supabase.from("chat_messages").update({ read_by_user: true }).eq("user_id", threadUserId).eq("read_by_user", false);
      }
    })();

    const channel = supabase
      .channel(`chat-${threadUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `user_id=eq.${threadUserId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Msg]);
          scrollToBottom();
          // auto-mark read for incoming
          const m = payload.new as Msg;
          if (asAdmin && !m.is_admin) {
            supabase.from("chat_messages").update({ read_by_admin: true }).eq("id", m.id);
          } else if (!asAdmin && m.is_admin) {
            supabase.from("chat_messages").update({ read_by_user: true }).eq("id", m.id);
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [threadUserId, asAdmin]);

  const handleSend = async () => {
    if (!text.trim() && !imageFile) return;
    setSending(true);
    try {
      let image_url: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() || "jpg";
        const path = `${threadUserId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("chat-images").upload(path, imageFile, { upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
        image_url = data.publicUrl;
      }
      const { error } = await supabase.from("chat_messages").insert({
        user_id: threadUserId,
        sender_id: viewerId,
        is_admin: asAdmin,
        message: text.trim() || null,
        image_url,
        read_by_admin: asAdmin,
        read_by_user: !asAdmin,
      });
      if (error) throw error;
      setText("");
      setImageFile(null);
    } catch (e: any) {
      popup.error(e?.message || "Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-background ${className ?? ""}`}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-10">Belum ada pesan. Mulai chat sekarang!</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === viewerId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    mine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {!mine && (
                    <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                      {m.is_admin ? "Admin FormGua" : "User"}
                    </p>
                  )}
                  {m.image_url && (
                    <a href={m.image_url} target="_blank" rel="noreferrer" className="block mb-1">
                      <img src={m.image_url} alt="lampiran" className="rounded-lg max-h-56 object-contain bg-background/40" loading="lazy" />
                    </a>
                  )}
                  {m.message && <p className="whitespace-pre-wrap break-words">{m.message}</p>}
                  <p className={`text-[9px] mt-1 ${mine ? "opacity-70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t p-2 sm:p-3 space-y-2 bg-background">
        {imageFile && (
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1.5 text-xs">
            <ImagePlus className="h-3.5 w-3.5" />
            <span className="flex-1 truncate">{imageFile.name}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setImageFile(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && f.size > 5 * 1024 * 1024) { popup.error("Maks 5MB"); return; }
                setImageFile(f ?? null);
                e.target.value = "";
              }}
            />
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent">
              <ImagePlus className="h-4 w-4" />
            </span>
          </label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Tulis pesan..."
            className="flex-1 h-9 text-sm"
            disabled={sending}
          />
          <Button size="sm" onClick={handleSend} disabled={sending || (!text.trim() && !imageFile)} className="h-9 gap-1.5">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
