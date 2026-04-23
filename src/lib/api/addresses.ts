import { supabase } from "@/integrations/supabase/client";

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string | null;
  address_line: string;
  city: string | null;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type AddressInput = Omit<Address, "id" | "user_id" | "created_at" | "updated_at">;

export async function listAddresses(): Promise<Address[]> {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Address[];
}

export async function createAddress(input: AddressInput): Promise<Address> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not signed in");
  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...input, user_id: userData.user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Address;
}

export async function updateAddress(id: string, input: Partial<AddressInput>): Promise<Address> {
  const { data, error } = await supabase
    .from("addresses")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Address;
}

export async function deleteAddress(id: string): Promise<void> {
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) throw error;
}

export async function setDefaultAddress(id: string): Promise<void> {
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
  if (error) throw error;
}
