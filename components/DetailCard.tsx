"use client";

import { Entry } from "@/lib/types";
import GlassCard from "./GlassCard";

interface DetailCardProps {
  entry: Entry;
}

function TokenMeta({ entry }: { entry: Entry }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {entry.ticker && (
        <div>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
            Ticker
          </p>
          <p className="text-lg font-semibold text-purple-300">
            {entry.ticker}
          </p>
        </div>
      )}
      {entry.chain && (
        <div>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
            Chain
          </p>
          <p className="text-sm text-white/80 capitalize">{entry.chain}</p>
        </div>
      )}
      {entry.ath_market_cap && (
        <div>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
            ATH Market Cap
          </p>
          <p className="text-sm text-white/80">
            ${entry.ath_market_cap.toLocaleString()}
          </p>
        </div>
      )}
      {entry.launch_date && (
        <div>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
            Launch Date
          </p>
          <p className="text-sm text-white/80">{entry.launch_date}</p>
        </div>
      )}
      {entry.status && (
        <div>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
            Status
          </p>
          <p className="text-sm capitalize text-white/80">{entry.status}</p>
        </div>
      )}
    </div>
  );
}

function CharacterMeta({ entry }: { entry: Entry }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {entry.known_for && (
        <div className="col-span-2">
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
            Known For
          </p>
          <p className="text-sm text-white/80">{entry.known_for}</p>
        </div>
      )}
      {entry.twitter_handle && (
        <div>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
            Twitter
          </p>
          <p className="text-sm text-blue-300">@{entry.twitter_handle}</p>
        </div>
      )}
      {entry.status && (
        <div>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
            Status
          </p>
          <p className="text-sm capitalize text-white/80">{entry.status}</p>
        </div>
      )}
    </div>
  );
}

function MomentMeta({ entry }: { entry: Entry }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {entry.moment_date && (
        <div>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
            Date
          </p>
          <p className="text-sm text-white/80">{entry.moment_date}</p>
        </div>
      )}
      {entry.impact && (
        <div>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
            Impact
          </p>
          <p className="text-sm capitalize text-amber-300">{entry.impact}</p>
        </div>
      )}
    </div>
  );
}

function MemeMeta({ entry }: { entry: Entry }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {entry.origin && (
        <div className="col-span-2">
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
            Origin
          </p>
          <p className="text-sm text-white/80">{entry.origin}</p>
        </div>
      )}
      {entry.origin_date && (
        <div>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
            Origin Date
          </p>
          <p className="text-sm text-white/80">{entry.origin_date}</p>
        </div>
      )}
      {entry.still_active !== null && (
        <div>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
            Still Active
          </p>
          <p className="text-sm text-emerald-300">
            {entry.still_active ? "Yes" : "No"}
          </p>
        </div>
      )}
    </div>
  );
}

const META_COMPONENTS: Record<string, React.FC<{ entry: Entry }>> = {
  token: TokenMeta,
  character: CharacterMeta,
  moment: MomentMeta,
  meme: MemeMeta,
};

export default function DetailCard({ entry }: DetailCardProps) {
  const MetaComponent = META_COMPONENTS[entry.type];

  return (
    <GlassCard strong className="p-6">
      {MetaComponent && <MetaComponent entry={entry} />}
    </GlassCard>
  );
}
