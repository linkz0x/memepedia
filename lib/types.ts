export type EntryType = "token" | "character" | "moment" | "meme";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type MomentImpact = "bullish" | "bearish" | "chaotic" | "legendary";

export interface Entry {
  id: string;
  type: EntryType;
  name: string;
  slug: string;
  headline: string;
  description: string;
  image_url: string | null;
  significance: number;
  tags: string[];
  status: string | null;
  review_status: ReviewStatus;
  submitted_by_email: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;

  chain: string | null;
  ticker: string | null;
  ath_market_cap: number | null;
  launch_date: string | null;
  meme_slug: string | null;

  known_for: string | null;
  twitter_handle: string | null;

  moment_date: string | null;
  impact: string | null;

  origin: string | null;
  origin_date: string | null;
  still_active: boolean | null;
}

export const TYPE_LABELS: Record<EntryType, string> = {
  token: "Tokens",
  character: "Characters",
  moment: "Moments",
  meme: "Memes",
};

export const TYPE_COLORS: Record<EntryType, string> = {
  token: "#8b5cf6",
  character: "#3b82f6",
  moment: "#f59e0b",
  meme: "#10b981",
};
