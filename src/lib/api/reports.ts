// Report API — flag products, shops, services, users, or reviews.
import { supabase } from "@/integrations/supabase/client";

export type ReportTarget = "product" | "shop" | "service" | "user" | "review";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface CreateReportInput {
  target_type: ReportTarget;
  target_id: string;
  reason: string;
  details?: string;
}

export async function createReport(input: CreateReportInput) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Sign in to report");
  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: userData.user.id,
      target_type: input.target_type,
      target_id: input.target_id,
      reason: input.reason,
      details: input.details ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Admin: list all reports, newest first. */
export async function listReports(status?: ReportStatus) {
  let qb = supabase.from("reports").select("*").order("created_at", { ascending: false });
  if (status) qb = qb.eq("status", status);
  const { data, error } = await qb.limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function updateReportStatus(id: string, status: ReportStatus, admin_notes?: string) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("reports")
    .update({
      status,
      admin_notes: admin_notes ?? null,
      reviewed_by: userData.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
