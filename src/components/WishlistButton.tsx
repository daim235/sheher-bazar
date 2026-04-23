// Heart toggle for saving a product to the wishlist.
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { addToWishlist, removeFromWishlist } from "@/lib/api/wishlist";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  productId: string;
  variant?: "icon" | "full";
  className?: string;
}

export function WishlistButton({ productId, variant = "icon", className }: Props) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return;
      if (!data.user) { setAuthed(false); return; }
      setAuthed(true);
      const { data: row } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", data.user.id)
        .eq("product_id", productId)
        .maybeSingle();
      if (!cancelled) setSaved(!!row);
    });
    return () => { cancelled = true; };
  }, [productId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!authed) {
      toast.info("Sign in to save items");
      navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      if (saved) {
        await removeFromWishlist(productId);
        setSaved(false);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(productId);
        setSaved(true);
        toast.success("Saved to wishlist");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update wishlist");
    } finally {
      setBusy(false);
    }
  };

  if (variant === "full") {
    return (
      <Button type="button" variant={saved ? "secondary" : "outline"} onClick={toggle} disabled={busy} className={className}>
        <Heart className={`h-4 w-4 mr-2 ${saved ? "fill-destructive text-destructive" : ""}`} />
        {saved ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={`absolute top-2 left-2 z-10 h-8 w-8 rounded-full bg-card/90 backdrop-blur flex items-center justify-center shadow-soft hover:scale-110 transition-base ${className ?? ""}`}
    >
      <Heart className={`h-4 w-4 ${saved ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
    </button>
  );
}
