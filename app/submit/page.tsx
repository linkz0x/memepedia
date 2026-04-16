"use client";

import { useState } from "react";
import { submitEntry } from "./actions";
import Link from "next/link";
import { TYPE_COLORS } from "@/lib/types";
import type { EntryType } from "@/lib/types";
import Select from "@/components/Select";

const TYPES: { value: EntryType; label: string }[] = [
  { value: "token", label: "Token" },
  { value: "character", label: "Character" },
  { value: "moment", label: "Moment" },
  { value: "meme", label: "Meme" },
];

const CHAIN_OPTIONS = [
  { value: "Ethereum", label: "Ethereum" },
  { value: "Solana", label: "Solana" },
  { value: "Base", label: "Base" },
  { value: "BSC", label: "BSC" },
  { value: "Other", label: "Other" },
];

const IMPACT_OPTIONS = [
  { value: "bullish", label: "Bullish" },
  { value: "bearish", label: "Bearish" },
  { value: "chaotic", label: "Chaotic" },
  { value: "legendary", label: "Legendary" },
];

const ACTIVE_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

export default function SubmitPage() {
  const [type, setType] = useState<EntryType>("token");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [chain, setChain] = useState("");
  const [impact, setImpact] = useState("");
  const [stillActive, setStillActive] = useState("true");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setResult({ error: "Image must be under 2MB." });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setResult(null);
    formData.set("type", type);
    formData.set("tags", tags.join(","));
    if (imageFile) {
      formData.set("image", imageFile);
    } else {
      formData.delete("image");
    }
    const res = await submitEntry(formData);
    setResult(res);
    setSubmitting(false);
  }

  if (result?.success) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-4">
        <div className="glass-strong rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-white/90 mb-2">
            Submitted
          </h2>
          <p className="text-sm text-white/50 mb-6">
            Your entry has been submitted for review.
          </p>
          <Link
            href="/"
            className="glass rounded-full px-6 py-2.5 text-sm text-white/70 hover:text-white/90 transition-colors inline-block"
          >
            Back to Map
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh overflow-y-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-white/90 text-glow">
              Request Entry
            </h1>
            <p className="text-xs text-white/40 mt-1">
              Submit a new entry to Memepedia
            </p>
          </div>
          <Link
            href="/"
            className="glass rounded-full px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            Back
          </Link>
        </div>

        <form action={handleSubmit} className="space-y-6">
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all"
                style={{
                  background:
                    type === t.value
                      ? `${TYPE_COLORS[t.value]}20`
                      : "rgba(255,255,255,0.04)",
                  borderWidth: 1,
                  borderColor:
                    type === t.value
                      ? TYPE_COLORS[t.value]
                      : "rgba(255,255,255,0.08)",
                  color:
                    type === t.value
                      ? TYPE_COLORS[t.value]
                      : "rgba(255,255,255,0.4)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="glass rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                Name *
              </label>
              <input
                name="name"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
                placeholder="e.g. Dogecoin"
              />
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                Headline *
              </label>
              <input
                name="headline"
                required
                maxLength={120}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
                placeholder="A short description"
              />
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                Description *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors resize-none"
                placeholder="Tell the full story..."
              />
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                Image
              </label>
              <div className="relative">
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-black/60 rounded-full w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border border-dashed border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-colors">
                    <span className="text-xs text-white/30">
                      Click to upload (max 2MB, JPG/PNG/WebP/GIF)
                    </span>
                    <input
                      name="image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="glass rounded-full px-3 py-1 text-xs text-white/60 flex items-center gap-1.5"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-white/30 hover:text-white/60"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
                  placeholder="Add a tag and press Enter"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1.5">
                Your Email (optional)
              </label>
              <input
                name="email"
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
                placeholder="For follow-up if needed"
              />
            </div>
          </div>

          {type === "token" && (
            <div className="glass rounded-2xl p-6 space-y-5">
              <h3
                className="text-sm font-medium"
                style={{ color: TYPE_COLORS.token }}
              >
                Token Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">
                    Ticker
                  </label>
                  <input
                    name="ticker"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
                    placeholder="e.g. DOGE"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">
                    Chain
                  </label>
                  <Select
                    name="chain"
                    value={chain}
                    onChange={setChain}
                    options={CHAIN_OPTIONS}
                    placeholder="Select chain"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">
                    Launch Date
                  </label>
                  <input
                    name="launch_date"
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">
                    ATH Market Cap ($)
                  </label>
                  <input
                    name="ath_market_cap"
                    type="number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
                    placeholder="e.g. 85000000000"
                  />
                </div>
              </div>
            </div>
          )}

          {type === "character" && (
            <div className="glass rounded-2xl p-6 space-y-5">
              <h3
                className="text-sm font-medium"
                style={{ color: TYPE_COLORS.character }}
              >
                Character Details
              </h3>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">
                  Known For
                </label>
                <input
                  name="known_for"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
                  placeholder="What are they known for?"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">
                  Twitter/X Handle
                </label>
                <input
                  name="twitter_handle"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
                  placeholder="@handle"
                />
              </div>
            </div>
          )}

          {type === "moment" && (
            <div className="glass rounded-2xl p-6 space-y-5">
              <h3
                className="text-sm font-medium"
                style={{ color: TYPE_COLORS.moment }}
              >
                Moment Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">
                    Date
                  </label>
                  <input
                    name="moment_date"
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">
                    Impact
                  </label>
                  <Select
                    name="impact"
                    value={impact}
                    onChange={setImpact}
                    options={IMPACT_OPTIONS}
                    placeholder="Select impact"
                  />
                </div>
              </div>
            </div>
          )}

          {type === "meme" && (
            <div className="glass rounded-2xl p-6 space-y-5">
              <h3
                className="text-sm font-medium"
                style={{ color: TYPE_COLORS.meme }}
              >
                Meme Details
              </h3>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">
                  Origin
                </label>
                <input
                  name="origin"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
                  placeholder="Where did this meme originate?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">
                    Origin Date
                  </label>
                  <input
                    name="origin_date"
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">
                    Still Active?
                  </label>
                  <Select
                    name="still_active"
                    value={stillActive}
                    onChange={setStillActive}
                    options={ACTIVE_OPTIONS}
                  />
                </div>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="glass rounded-xl p-4 border border-red-500/20">
              <p className="text-sm text-red-400">{result.error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full glass-strong rounded-xl py-3 text-sm font-medium text-white/80 hover:text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <span className="spinner" />}
            {submitting ? "Submitting" : "Submit for Review"}
          </button>
        </form>
      </div>
    </main>
  );
}
