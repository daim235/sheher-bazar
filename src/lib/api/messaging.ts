// Messaging helpers — unread counts and read-receipts.
import { supabase } from "@/integrations/supabase/client";

/** Total unread messages across all conversations the user participates in. */
export async function getUnreadCount(userId: string): Promise<number> {
  // Get all conversations the user is in, then count messages where read_at is null
  // and sender is the OTHER party.
  const { data: convos } = await supabase
    .from("conversations")
    .select("id, user1_id, user2_id")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
  if (!convos || convos.length === 0) return 0;

  const ids = convos.map((c) => c.id);
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", ids)
    .neq("sender_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

/** Per-conversation unread counts for the inbox UI. */
export async function getUnreadByConversation(userId: string, convoIds: string[]): Promise<Record<string, number>> {
  if (convoIds.length === 0) return {};
  const { data } = await supabase
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", convoIds)
    .neq("sender_id", userId)
    .is("read_at", null);
  const map: Record<string, number> = {};
  for (const r of data ?? []) {
    map[r.conversation_id] = (map[r.conversation_id] ?? 0) + 1;
  }
  return map;
}

/** Mark all messages in a conversation as read for the current user. */
export async function markConversationRead(conversationId: string, userId: string) {
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}
