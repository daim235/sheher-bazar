// Refund request API — customers request, vendors/admins respond.
import { supabase } from "@/integrations/supabase/client";

export type RefundStatus = "pending" | "approved" | "rejected" | "refunded";

export interface CreateRefundInput {
  order_id: string;
  vendor_id: string;
  reason: string;
  details?: string;
  amount: number;
}

export async function createRefundRequest(input: CreateRefundInput) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Sign in to request a refund");
  const { data, error } = await supabase
    .from("refund_requests")
    .insert({
      order_id: input.order_id,
      customer_id: userData.user.id,
      vendor_id: input.vendor_id,
      reason: input.reason,
      details: input.details ?? null,
      amount: input.amount,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMyRefundRequests() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("refund_requests")
    .select("*")
    .eq("customer_id", userData.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getVendorRefundRequests(vendorId: string) {
  const { data, error } = await supabase
    .from("refund_requests")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function setRefundStatus(id: string, status: RefundStatus, vendor_response?: string) {
  const { data, error } = await supabase
    .from("refund_requests")
    .update({
      status,
      vendor_response: vendor_response ?? null,
      resolved_at: status === "pending" ? null : new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
