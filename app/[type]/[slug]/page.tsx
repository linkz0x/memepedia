import { notFound } from "next/navigation";
import Link from "next/link";
import { getEntryBySlug, getEntryByMemeSlug } from "@/lib/queries";
import DetailCard from "@/components/DetailCard";
import GlassCard from "@/components/GlassCard";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ type: string; slug: string }>;
}

export default async function EntryPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getEntryBySlug(slug);

  if (!entry) notFound();

  let originMeme = null;
  if (entry.type === "token" && entry.meme_slug) {
    originMeme = await getEntryByMemeSlug(entry.meme_slug);
  }

  return (
    <main className="min-h-dvh overflow-y-auto pb-20"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(88, 28, 135, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(30, 58, 138, 0.1) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm text-white/60 hover:text-white/90 transition-colors mb-8"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Map
        </Link>

        {entry.image_url && (
          <div className="mb-8 rounded-2xl overflow-hidden glass">
            <img
              src={entry.image_url}
              alt={entry.name}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        <div className="mb-2">
          <span className="text-xs uppercase tracking-widest text-white/30">
            {entry.type}
          </span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-2 text-glow">
          {entry.name}
        </h1>

        <p className="text-lg text-white/50 mb-8">{entry.headline}</p>

        <div className="mb-8">
          <DetailCard entry={entry} />
        </div>

        <GlassCard className="p-6 mb-8">
          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">
            {entry.description}
          </p>
        </GlassCard>

        {originMeme && (
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest text-white/30 mb-3">
              Origin Meme
            </p>
            <Link href={`/memes/${originMeme.slug}`}>
              <GlassCard className="p-5 hover:bg-white/[0.06] transition-colors">
                <p className="text-sm font-medium text-white/90">
                  {originMeme.name}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {originMeme.headline}
                </p>
              </GlassCard>
            </Link>
          </div>
        )}

        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="glass rounded-full px-3 py-1 text-xs text-white/50"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
