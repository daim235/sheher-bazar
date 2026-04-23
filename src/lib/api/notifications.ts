// Notifications API — used by header bell, dashboard, admin panel.
import { supabase } from "@/integrations/supabase/client";

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export async function listMyNotifications(limit = 30): Promise<AppNotification[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userData.user.id)
    .eq("read", false);
  if (error) throw error;
}

/** Subscribe to realtime new-notification inserts for the current user. */
export function subscribeToMyNotifications(userId: string, onInsert: (n: AppNotification) => void) {
  const channel = supabase
    .channel(`notifications-${userId}-${Math.random().toString(36).slice(2, 10)}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new as AppNotification)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
