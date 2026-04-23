// Order checkout API — handles cart → order placement and status transitions.
import { supabase } from "@/integrations/supabase/client";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface CartItem {
  product_id: string;
  vendor_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PlaceOrderInput {
  items: CartItem[]; // all items must share the same vendor_id; otherwise we split into multiple orders
  shipping_address: string;
  phone: string;
  notes?: string;
}

export interface PlacedOrder {
  id: string;
  vendor_id: string;
  total: number;
}

/**
 * Place one or more orders from a cart.
 * Items are grouped by vendor — one order per vendor.
 * RLS: customer must be authenticated.
 */
export async function placeOrders(input: PlaceOrderInput): Promise<PlacedOrder[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  const customerId = userData.user.id;

  // Group by vendor
  const byVendor = new Map<string, CartItem[]>();
  for (const it of input.items) {
    if (!byVendor.has(it.vendor_id)) byVendor.set(it.vendor_id, []);
    byVendor.get(it.vendor_id)!.push(it);
  }

  const placed: PlacedOrder[] = [];
  for (const [vendorId, items] of byVendor) {
    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        vendor_id: vendorId,
        total,
        shipping_address: input.shipping_address,
        phone: input.phone,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    const itemsRows = items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      product_name: it.name,
      unit_price: it.price,
      quantity: it.quantity,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemsRows);
    if (itemsErr) throw itemsErr;

    placed.push({ id: order.id, vendor_id: vendorId, total });
  }
  return placed;
}

/** Customer's own orders. */
export async function getMyOrders() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*), vendor:vendors(shop_name, slug)")
    .eq("customer_id", userData.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Orders for shops owned by the current user (vendor view). */
export async function getMyVendorOrders() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data: vendors } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", userData.user.id);
  const vendorIds = (vendors ?? []).map((v) => v.id);
  if (vendorIds.length === 0) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .in("vendor_id", vendorIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Vendor or customer updates the order status. */
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
