"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Entry, TYPE_COLORS } from "@/lib/types";
import { approveEntry, rejectEntry, deleteEntry } from "../actions";
import Link from "next/link";

export default function ReviewForm({ entry }: { entry: Entry }) {
  const router = useRouter();
  const [significance, setSignificance] = useState(entry.significance || 5);
  const [name, setName] = useState(entry.name);
  const [headline, setHeadline] = useState(entry.headline);
  const [description, setDescription] = useState(entry.description);
  const [sourceUrl, setSourceUrl] = useState(entry.source_url || "");
  const [reviewNote, setReviewNote] = useState(entry.review_note || "");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleApprove() {
    setLoading("approve");
    const result = await approveEntry(entry.id, {
      name,
      headline,
      description,
      source_url: sourceUrl || null,
      significance,
    });
    if (result.success) {
      router.push("/council-of-elders");
      router.refresh();
    }
    setLoading(null);
  }

  async function handleReject() {
    setLoading("reject");
    const result = await rejectEntry(entry.id, reviewNote);
    if (result.success) {
      router.push("/council-of-elders");
      router.refresh();
    }
    setLoading(null);
  }

  async function handleDelete() {
    if (!confirm("Permanently delete this entry?")) return;
    setLoading("delete");
    const result = await deleteEntry(entry.id);
    if (result.success) {
      router.push("/council-of-elders");
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/council-of-elders"
            className="glass rounded-full px-4 py-2 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Back
          </Link>
          <span
            className="text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full"
            style={{
              color: TYPE_COLORS[entry.type],
              background: `${TYPE_COLORS[entry.type]}15`,
            }}
          >
            {entry.type}
          </span>
          <span
            className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{
              color:
                entry.review_status === "pending"
                  ? "#f59e0b"
                  : entry.review_status === "approved"
                    ? "#10b981"
                    : "#ef4444",
              background:
                entry.review_status === "pending"
                  ? "#f59e0b15"
                  : entry.review_status === "approved"
                    ? "#10b98115"
                    : "#ef444415",
            }}
          >
            {entry.review_status}
          </span>
        </div>
        {entry.submitted_by_email && (
          <p className="text-[10px] text-white/30">
            from {entry.submitted_by_email}
          </p>
        )}
      </div>

      {entry.image_url && (
        <div className="glass rounded-2xl overflow-hidden mb-6">
          <img
            src={entry.image_url}
            alt={entry.name}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      <div className="glass rounded-2xl p-6 space-y-5 mb-6">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">
            Headline
          </label>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">
            Source URL
          </label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 mb-1.5">
            Significance: {significance}
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={significance}
            onChange={(e) => setSignificance(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-[10px] text-white/20 mt-1">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        {entry.tags.length > 0 && (
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Tags</label>
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
          </div>
        )}

        {entry.type === "token" && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <Detail label="Ticker" value={entry.ticker} />
            <Detail label="Chain" value={entry.chain} />
            <Detail label="Launch Date" value={entry.launch_date} />
            <Detail
              label="ATH Market Cap"
              value={
                entry.ath_market_cap
                  ? `$${entry.ath_market_cap.toLocaleString()}`
                  : null
              }
            />
            {entry.contract_address && (
              <div className="col-span-2">
                <p className="text-[10px] text-white/30">Contract</p>
                <p className="text-xs text-white/60 font-mono break-all">
                  {entry.contract_address}
                </p>
              </div>
            )}
          </div>
        )}

        {entry.type === "character" && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <Detail label="Known For" value={entry.known_for} />
            <Detail label="Twitter" value={entry.twitter_handle} />
          </div>
        )}

        {entry.type === "moment" && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <Detail label="Date" value={entry.moment_date} />
            <Detail label="Impact" value={entry.impact} />
          </div>
        )}

        {entry.type === "meme" && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
            <Detail label="Origin" value={entry.origin} />
            <Detail label="Origin Date" value={entry.origin_date} />
            <Detail
              label="Still Active"
              value={entry.still_active ? "Yes" : "No"}
            />
          </div>
        )}
      </div>

      {entry.review_status === "pending" && (
        <>
          <div className="glass rounded-2xl p-6 mb-6">
            <label className="block text-xs text-white/40 mb-1.5">
              Review Note (optional, internal)
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors resize-none"
              placeholder="Reason for rejection, notes for yourself..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={loading !== null}
              className="flex-1 rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                background: "#10b98120",
                border: "1px solid #10b98140",
                color: "#10b981",
              }}
            >
              {loading === "approve" ? "Approving..." : "Approve"}
            </button>
            <button
              onClick={handleReject}
              disabled={loading !== null}
              className="flex-1 rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                background: "#ef444420",
                border: "1px solid #ef444440",
                color: "#ef4444",
              }}
            >
              {loading === "reject" ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleDelete}
          disabled={loading !== null}
          className="text-[10px] text-white/20 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {loading === "delete" ? "Deleting..." : "Delete permanently"}
        </button>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] text-white/30">{label}</p>
      <p className="text-sm text-white/60">{value}</p>
    </div>
  );
}
