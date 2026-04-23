// Coupon API — vendor-issued discount codes.
import { supabase } from "@/integrations/supabase/client";

export type DiscountType = "percent" | "fixed";

export interface Coupon {
  id: string;
  vendor_id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_redemptions: number | null;
  redemption_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCouponInput {
  vendor_id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount?: number;
  max_redemptions?: number | null;
  expires_at?: string | null;
}

export async function createCoupon(input: CreateCouponInput) {
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      vendor_id: input.vendor_id,
      code: input.code.toUpperCase().trim(),
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      min_order_amount: input.min_order_amount ?? 0,
      max_redemptions: input.max_redemptions ?? null,
      expires_at: input.expires_at ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Coupon;
}

export async function listVendorCoupons(vendorId: string) {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Coupon[];
}

export async function toggleCoupon(id: string, is_active: boolean) {
  const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id);
  if (error) throw error;
}

export async function deleteCoupon(id: string) {
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Validate a coupon code against a vendor + cart subtotal.
 * Returns the discount amount in Rs and the coupon, or throws a friendly error.
 */
export async function validateCoupon(
  vendorId: string,
  code: string,
  subtotal: number,
): Promise<{ coupon: Coupon; discount: number }> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("vendor_id", vendorId)
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Invalid coupon code");
  const coupon = data as Coupon;
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new Error("This coupon has expired");
  }
  if (coupon.max_redemptions !== null && coupon.redemption_count >= coupon.max_redemptions) {
    throw new Error("This coupon has reached its limit");
  }
  if (subtotal < Number(coupon.min_order_amount)) {
    throw new Error(`Minimum order Rs ${Number(coupon.min_order_amount).toLocaleString()} required`);
  }
  const discount = coupon.discount_type === "percent"
    ? Math.round((subtotal * Number(coupon.discount_value)) / 100)
    : Math.min(subtotal, Number(coupon.discount_value));
  return { coupon, discount };
}
