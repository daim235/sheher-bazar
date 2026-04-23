// Wishlist API — saves products users want to buy later.
import { supabase } from "@/integrations/supabase/client";

export interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    vendor_id: string;
    is_active: boolean;
  } | null;
}

export async function getMyWishlist(): Promise<WishlistItem[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data, error } = await supabase
    .from("wishlists")
    .select("id, product_id, created_at, product:products(id, name, price, image_url, vendor_id, is_active)")
    .eq("user_id", u.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as WishlistItem[];
}

export async function getMyWishlistIds(): Promise<Set<string>> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return new Set();
  const { data } = await supabase.from("wishlists").select("product_id").eq("user_id", u.user.id);
  return new Set((data ?? []).map((r) => r.product_id));
}

export async function addToWishlist(productId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Please sign in to save items");
  const { error } = await supabase.from("wishlists").insert({ user_id: u.user.id, product_id: productId });
  if (error && error.code !== "23505") throw error; // ignore duplicate
}

export async function removeFromWishlist(productId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", u.user.id)
    .eq("product_id", productId);
  if (error) throw error;
}
