import { createAdminSupabase } from "@/lib/supabase-server";
import { Entry } from "@/lib/types";
import { TYPE_COLORS } from "@/lib/types";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

async function getEntriesByReviewStatus(status: string): Promise<Entry[]> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("review_status", status)
    .order("submitted_at", { ascending: false });

  if (error) return [];
  return data as Entry[];
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab || "pending";
  const entries = await getEntriesByReviewStatus(activeTab);

  const tabs = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <main className="py-8 px-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white/90 text-glow">
            Council of Elders
          </h1>
          <p className="text-xs text-white/40 mt-1">Submission Review</p>
        </div>
        <LogoutButton />
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/council-of-elders?tab=${t.key}`}
            className="rounded-xl px-4 py-2 text-sm transition-all"
            style={{
              background:
                activeTab === t.key
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(255,255,255,0.04)",
              borderWidth: 1,
              borderColor:
                activeTab === t.key
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.08)",
              color:
                activeTab === t.key
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(255,255,255,0.4)",
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-sm text-white/40">
            No {activeTab} entries.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/council-of-elders/${entry.id}`}
              className="glass rounded-2xl p-5 flex items-center justify-between hover:bg-white/5 transition-colors block"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    color: TYPE_COLORS[entry.type],
                    background: `${TYPE_COLORS[entry.type]}15`,
                  }}
                >
                  {entry.type}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-white/80 truncate">
                    {entry.name}
                  </p>
                  <p className="text-xs text-white/30 truncate">
                    {entry.headline}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-[10px] text-white/20">
                  {entry.submitted_at
                    ? new Date(entry.submitted_at).toLocaleDateString()
                    : ""}
                </p>
                {entry.submitted_by_email && (
                  <p className="text-[10px] text-white/20 truncate max-w-[150px]">
                    {entry.submitted_by_email}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
