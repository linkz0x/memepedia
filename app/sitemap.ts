import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://memepedia.meme";

const TYPE_PLURALS: Record<string, string> = {
  token: "tokens",
  character: "characters",
  moment: "moments",
  meme: "memes",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("entries")
    .select("type, slug, updated_at")
    .eq("review_status", "approved");

  const entries: MetadataRoute.Sitemap = (data || []).map(
    (e: { type: string; slug: string; updated_at: string }) => ({
      url: `${siteUrl}/${TYPE_PLURALS[e.type]}/${e.slug}`,
      lastModified: new Date(e.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })
  );

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...entries,
  ];
}
