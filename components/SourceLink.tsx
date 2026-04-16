function labelForUrl(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("x.com") || host.includes("twitter.com")) {
      return "View on X";
    }
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      return "Watch on YouTube";
    }
    if (host.includes("dexscreener")) {
      return "View on DexScreener";
    }
    return "View Source";
  } catch {
    return "View Source";
  }
}

export default function SourceLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass rounded-full px-4 py-2 text-xs text-white/60 hover:text-white/90 transition-colors inline-flex items-center gap-2 w-fit"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 17L17 7M17 7H8M17 7V16"
        />
      </svg>
      {labelForUrl(url)}
    </a>
  );
}
