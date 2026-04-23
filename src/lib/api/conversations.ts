// Conversation helpers — find or create a 1:1 thread between two users.
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the existing conversation between current user and `otherUserId`,
 * or creates a new one. Stores users in canonical (sorted) order so we don't
 * end up with duplicate threads.
 */
export async function getOrCreateConversation(otherUserId: string): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Sign in to start a conversation");
  const me = userData.user.id;
  if (me === otherUserId) throw new Error("You can't message yourself");

  const [user1_id, user2_id] = [me, otherUserId].sort();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user1_id", user1_id)
    .eq("user2_id", user2_id)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ user1_id, user2_id })
    .select("id")
    .single();
  if (error) throw error;
  return created.id;
}
