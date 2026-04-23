// Hook: total unread message count for the current user, with realtime updates.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUnreadCount } from "@/lib/api/messaging";

export function useUnreadMessages(userId: string | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) { setCount(0); return; }
    let active = true;

    const refresh = () => {
      getUnreadCount(userId).then((n) => { if (active) setCount(n); }).catch(() => {});
    };
    refresh();

    const channel = supabase
      .channel(`unread-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => refresh())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => refresh())
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [userId]);

  return count;
}
