import { getAllEntries } from "@/lib/queries";
import BubbleMap from "@/components/BubbleMap";
import SearchBar from "@/components/SearchBar";
import { EntryType } from "@/lib/types";

export const revalidate = 60;

const VALID_EXPAND_TYPES: Record<string, EntryType> = {
  tokens: "token",
  characters: "character",
  moments: "moment",
  memes: "meme",
};

interface HomePageProps {
  searchParams: Promise<{ expand?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { expand } = await searchParams;
  const expandType = expand ? VALID_EXPAND_TYPES[expand] || null : null;

  let entries: Awaited<ReturnType<typeof getAllEntries>> = [];
  try {
    entries = await getAllEntries();
  } catch {
    entries = [];
  }

  return (
    <main className="relative w-full h-dvh overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4 hidden sm:block">
        <SearchBar />
      </div>

      <div className="absolute top-4 left-4 right-4 z-20 flex items-start gap-3 sm:block sm:left-6 sm:right-auto sm:top-6">
        <div className="shrink-0">
          <h1 className="text-lg sm:text-xl font-semibold text-white/90 text-glow">
            Memepedia
          </h1>
          <p className="text-[10px] sm:text-xs text-white/40 mt-0.5">
            The Wikipedia of Meme Coins
          </p>
          <p
            id="category-label"
            className="text-xs sm:text-sm font-medium mt-1.5 transition-all duration-400 opacity-0"
          />
        </div>
        <div className="flex-1 sm:hidden">
          <SearchBar />
        </div>
      </div>

      <div className="w-full h-full">
        {entries.length > 0 ? (
          <BubbleMap entries={entries} expandType={expandType} />
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
