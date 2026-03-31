import { getAllEntries } from "@/lib/queries";
import BubbleMap from "@/components/BubbleMap";
import SearchBar from "@/components/SearchBar";

export const revalidate = 60;

export default async function HomePage() {
  let entries: Awaited<ReturnType<typeof getAllEntries>> = [];
  try {
    entries = await getAllEntries();
  } catch {
    entries = [];
  }

  return (
    <main className="relative w-full h-dvh overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
        <SearchBar />
      </div>

      <div className="absolute top-6 left-6 z-20">
        <h1 className="text-xl font-semibold text-white/90 text-glow">
          Memepedia
        </h1>
        <p className="text-xs text-white/40 mt-0.5">
          The Wikipedia of Meme Coins
        </p>
      </div>

      <div className="w-full h-full">
        {entries.length > 0 ? (
          <BubbleMap entries={entries} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="glass rounded-2xl p-8 text-center max-w-md">
              <p className="text-white/60 text-sm">
                No entries found. Connect your Supabase database and run the
                seed file to get started.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
