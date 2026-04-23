// Inbox panel — list of conversations with unread counts + active thread view.
// Used inside dashboard; supports realtime inserts.
import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getUnreadByConversation, markConversationRead } from "@/lib/api/messaging";
import { toast } from "sonner";

interface Conversation { id: string; user1_id: string; user2_id: string; last_message_at: string; }
interface Profile { id: string; full_name: string | null; avatar_url: string | null; }
interface Message { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; read_at: string | null; }

export function InboxPanel({ userId, initialConvo }: { userId: string; initialConvo: string }) {
  const [convos, setConvos] = useState<(Conversation & { other: Profile | null; lastPreview: string })[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState<string>(initialConvo);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConvos = async () => {
    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });
    const list = (convs ?? []) as Conversation[];
    if (list.length === 0) { setConvos([]); setLoading(false); return; }

    const otherIds = list.map((c) => (c.user1_id === userId ? c.user2_id : c.user1_id));
    const ids = list.map((c) => c.id);
    const [{ data: profs }, { data: lastMsgs }, unreadMap] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url").in("id", otherIds),
      supabase.from("messages").select("conversation_id, content, created_at").in("conversation_id", ids).order("created_at", { ascending: false }).limit(200),
      getUnreadByConversation(userId, ids),
    ]);
    const profMap = new Map((profs ?? []).map((p) => [p.id, p as Profile]));
    const previewMap = new Map<string, string>();
    for (const m of lastMsgs ?? []) {
      if (!previewMap.has(m.conversation_id)) previewMap.set(m.conversation_id, m.content);
    }
    setConvos(list.map((c) => ({
      ...c,
      other: profMap.get(c.user1_id === userId ? c.user2_id : c.user1_id) ?? null,
      lastPreview: previewMap.get(c.id) ?? "",
    })));
    setUnread(unreadMap);
    setLoading(false);
    if (!activeId && list[0]) setActiveId(list[0].id);
  };

  useEffect(() => { loadConvos(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId]);

  // Subscribe to ALL message inserts for this user's conversations to keep unread + previews fresh.
  useEffect(() => {
    const channelName = `inbox-${userId}-${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase.channel(channelName);
    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message;
        // Only react if it belongs to a conversation this user is in (re-fetch convos for accuracy)
        loadConvos();
        if (m.conversation_id === activeId && m.sender_id !== userId) {
          setMessages((prev) => [...prev, m]);
          markConversationRead(activeId, userId).catch(() => {});
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeId]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeId) return;
    supabase.from("messages").select("*").eq("conversation_id", activeId).order("created_at", { ascending: true }).then(({ data }) => {
      setMessages((data ?? []) as Message[]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    markConversationRead(activeId, userId).then(() => {
      setUnread((prev) => ({ ...prev, [activeId]: 0 }));
    });
  }, [activeId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    const content = text.trim();
    setText("");
    // Optimistic
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      conversation_id: activeId,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    const { error } = await supabase.from("messages").insert({ conversation_id: activeId, sender_id: userId, content });
    if (error) { toast.error(error.message); setMessages((prev) => prev.filter((m) => m.id !== optimistic.id)); }
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mt-10" />;
  if (convos.length === 0) {
    return (
      <Card className="p-10 text-center">
        <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="mt-3 text-muted-foreground">No conversations yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Tap "Contact shop" on a product or "Chat" on a service to start.</p>
      </Card>
    );
  }

  const active = convos.find((c) => c.id === activeId) ?? convos[0];

  return (
    <Card className="grid grid-cols-1 md:grid-cols-3 h-[65vh] overflow-hidden">
      <div className="border-r border-border overflow-y-auto">
        {convos.map((c) => {
          const unreadN = unread[c.id] ?? 0;
          return (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className={`w-full text-left p-4 border-b border-border hover:bg-accent transition-base ${activeId === c.id ? "bg-accent" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm truncate flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                    {(c.other?.full_name ?? "U").charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{c.other?.full_name ?? "User"}</span>
                </div>
                {unreadN > 0 && (
                  <Badge className="h-5 min-w-5 px-1 text-[10px] bg-primary text-primary-foreground">{unreadN > 9 ? "9+" : unreadN}</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">{c.lastPreview || "—"}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(c.last_message_at).toLocaleString()}</div>
            </button>
          );
        })}
      </div>
      <div className="md:col-span-2 flex flex-col bg-background">
        <div className="border-b border-border px-4 py-3 flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
            {(active?.other?.full_name ?? "U").charAt(0).toUpperCase()}
          </span>
          <div className="font-semibold text-sm">{active?.other?.full_name ?? "User"}</div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.sender_id === userId ? "bg-gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className="text-center text-sm text-muted-foreground mt-10">Say hello 👋</p>}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={send} className="border-t border-border p-3 flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
          <Button type="submit" size="icon" className="bg-gradient-primary text-primary-foreground"><Send className="h-4 w-4" /></Button>
        </form>
      </div>
    </Card>
  );
}
