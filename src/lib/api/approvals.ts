// Vendor & Service Provider approval API
// Wraps supabase calls and security-definer RPCs created in the migration.
import { supabase } from "@/integrations/supabase/client";

export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ProviderStatus = "none" | "pending" | "approved" | "rejected";

// ---------- Vendor application ----------
export interface VendorApplicationInput {
  shop_name: string;
  slug: string;
  description?: string;
  city?: string;
  logo_url?: string;
  banner_url?: string;
}

/** Customer applies to become a vendor — creates a pending vendor record. */
export async function applyAsVendor(input: VendorApplicationInput) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("vendors")
    .insert({ ...input, owner_id: userData.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Get the current user's vendor record (if any). */
export async function getMyVendor() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("owner_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------- Service provider application ----------
export interface ProviderApplicationInput {
  skills: string;
  bio?: string;
  phone?: string;
  city?: string;
}

/** Submit / re-submit application to be a service provider. */
export async function applyAsProvider(input: ProviderApplicationInput) {
  const { data, error } = await supabase.rpc("apply_as_provider", {
    _skills: input.skills,
    _bio: input.bio ?? null,
    _phone: input.phone ?? null,
    _city: input.city ?? null,
  });
  if (error) throw error;
  return data;
}

// ---------- Admin actions ----------
export async function adminSetVendorStatus(vendorId: string, status: ApprovalStatus, reason?: string) {
  const { data, error } = await supabase.rpc("admin_set_vendor_status", {
    _vendor_id: vendorId,
    _status: status,
    _reason: reason ?? null,
  });
  if (error) throw error;
  return data;
}

export async function adminSetProviderStatus(userId: string, status: ProviderStatus, reason?: string) {
  const { data, error } = await supabase.rpc("admin_set_provider_status", {
    _user_id: userId,
    _status: status,
    _reason: reason ?? null,
  });
  if (error) throw error;
  return data;
}

// ---------- Admin queues ----------
export async function listPendingVendors() {
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listPendingProviders() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("provider_status", "pending")
    .order("provider_applied_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
