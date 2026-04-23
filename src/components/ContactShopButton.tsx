// Reusable "Message" button that opens (or creates) a conversation
// with the given user, then navigates to the dashboard messages tab.
import { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getOrCreateConversation } from "@/lib/api/conversations";
import { toast } from "sonner";

interface Props {
  otherUserId: string;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  fullWidth?: boolean;
}

export function ContactShopButton({
  otherUserId,
  label = "Message shop",
  variant = "outline",
  size = "default",
  className,
  fullWidth,
}: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!user) {
      toast.error("Sign in to message");
      navigate({ to: "/auth" });
      return;
    }
    setLoading(true);
    try {
      const id = await getOrCreateConversation(otherUserId);
      navigate({ to: "/dashboard", search: { tab: "messages", c: id } });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not start conversation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handle}
      disabled={loading || !otherUserId}
      className={`${fullWidth ? "w-full" : ""} ${className ?? ""}`}
    >
      {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-1.5" />}
      {label}
    </Button>
  );
}
