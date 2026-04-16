function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function TwitterHandle({ handle }: { handle: string | null }) {
  if (!handle) return null;

  if (handle.toLowerCase() === "banned") {
    return (
      <div className="glass rounded-full px-4 py-2 text-xs inline-flex items-center gap-2 w-fit opacity-60">
        <XIcon className="w-3.5 h-3.5 text-red-400/70" />
        <span className="text-red-300/70 line-through decoration-red-400/40">
          Banned from X
        </span>
      </div>
    );
  }

  return (
    <a
      href={`https://x.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="glass rounded-full px-4 py-2 text-xs text-white/60 hover:text-white/90 transition-colors inline-flex items-center gap-2 w-fit"
    >
      <XIcon className="w-3.5 h-3.5" />
      <span>@{handle}</span>
    </a>
  );
}
