"use server";

import { createAdminSupabase } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approveEntry(
  id: string,
  edits: Record<string, unknown>
) {
  if (!(await isAdmin())) return { error: "Unauthorized" };

  const supabase = createAdminSupabase();
  const { error } = await supabase
    .from("entries")
    .update({
      ...edits,
      review_status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

export async function rejectEntry(id: string, reviewNote?: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };

  const supabase = createAdminSupabase();
  const { error } = await supabase
    .from("entries")
    .update({
      review_status: "rejected",
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}

export async function deleteEntry(id: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };

  const supabase = createAdminSupabase();

  const { data: entry } = await supabase
    .from("entries")
    .select("image_url")
    .eq("id", id)
    .single();

  if (entry?.image_url) {
    const marker = "/entry-images/";
    const idx = entry.image_url.indexOf(marker);
    if (idx !== -1) {
      const path = entry.image_url.slice(idx + marker.length);
      await supabase.storage.from("entry-images").remove([path]);
    }
  }

  const { error } = await supabase.from("entries").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { success: true };
}
