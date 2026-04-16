"use server";

import { createAdminSupabase } from "@/lib/supabase-server";
import { headers } from "next/headers";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const supabase = createAdminSupabase();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("submission_rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("submitted_at", oneHourAgo);

  return (count ?? 0) < 5;
}

export async function submitEntry(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return { error: "Too many submissions. Please try again later." };
  }

  const supabase = createAdminSupabase();

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const headline = formData.get("headline") as string;
  const description = formData.get("description") as string;
  const tagsRaw = formData.get("tags") as string;
  const email = formData.get("email") as string;
  const image = formData.get("image") as File | null;

  if (!name || !type || !headline || !description) {
    return { error: "Please fill in all required fields." };
  }

  if (!["token", "character", "moment", "meme"].includes(type)) {
    return { error: "Invalid entry type." };
  }

  let slug = generateSlug(name);
  const { data: existing } = await supabase
    .from("entries")
    .select("slug")
    .eq("slug", slug)
    .single();

  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  let imageUrl: string | null = null;
  if (image && image.size > 0) {
    if (image.size > 2 * 1024 * 1024) {
      return { error: "Image must be under 2MB." };
    }

    const ext = image.name.split(".").pop();
    const path = `pending/${slug}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("entry-images")
      .upload(path, image);

    if (uploadError) {
      return { error: "Failed to upload image. Please try again." };
    }

    const { data: urlData } = supabase.storage
      .from("entry-images")
      .getPublicUrl(path);

    imageUrl = urlData.publicUrl;
  }

  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const entry: Record<string, unknown> = {
    type,
    name,
    slug,
    headline,
    description,
    image_url: imageUrl,
    significance: 1,
    tags,
    review_status: "pending",
    submitted_by_email: email || null,
    submitted_at: new Date().toISOString(),
  };

  if (type === "token") {
    entry.ticker = formData.get("ticker") || null;
    entry.chain = formData.get("chain") || null;
    entry.launch_date = formData.get("launch_date") || null;
    entry.ath_market_cap = formData.get("ath_market_cap")
      ? Number(formData.get("ath_market_cap"))
      : null;
  } else if (type === "character") {
    entry.known_for = formData.get("known_for") || null;
    entry.twitter_handle = formData.get("twitter_handle") || null;
  } else if (type === "moment") {
    entry.moment_date = formData.get("moment_date") || null;
    entry.impact = formData.get("impact") || null;
  } else if (type === "meme") {
    entry.origin = formData.get("origin") || null;
    entry.origin_date = formData.get("origin_date") || null;
    entry.still_active = formData.get("still_active") === "true";
  }

  const { error: insertError } = await supabase
    .from("entries")
    .insert(entry);

  if (insertError) {
    return { error: "Failed to submit entry. Please try again." };
  }

  await supabase
    .from("submission_rate_limits")
    .insert({ ip_address: ip });

  return { success: true };
}
