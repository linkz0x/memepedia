import { createAdminSupabase } from "@/lib/supabase";
import { Entry } from "@/lib/types";
import { notFound } from "next/navigation";
import ReviewForm from "./ReviewForm";

export const dynamic = "force-dynamic";

async function getEntry(id: string): Promise<Entry | null> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Entry;
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getEntry(id);

  if (!entry) notFound();

  return (
    <main className="py-8 px-4 max-w-3xl mx-auto">
      <ReviewForm entry={entry} />
    </main>
  );
}
