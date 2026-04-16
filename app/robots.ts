import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://memepedia.meme";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/council-of-elders", "/council-of-elders/*"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
