// Booking lifecycle API.
// Booking flow: pending → confirmed (accepted) → in_progress → completed (or cancelled).
import { supabase } from "@/integrations/supabase/client";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface CreateBookingInput {
  service_id: string;
  provider_id: string;
  scheduled_for?: string | null;
  address?: string;
  notes?: string;
}

/** Customer creates a service booking. Provider must be approved (RLS enforces this for the service). */
export async function createBooking(input: CreateBookingInput) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      service_id: input.service_id,
      provider_id: input.provider_id,
      customer_id: userData.user.id,
      scheduled_for: input.scheduled_for ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Provider accepts/rejects/completes; customer can cancel own pending booking. */
export async function setBookingStatus(bookingId: string, status: BookingStatus) {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** All bookings the user is a participant in (as customer or provider). */
export async function getMyBookings() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select("*, service:services(title, image_url, price)")
    .or(`customer_id.eq.${userData.user.id},provider_id.eq.${userData.user.id}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
