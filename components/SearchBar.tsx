"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Entry } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entry[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const { data } = await supabase
      .from("entries")
      .select("*")
      .or(`name.ilike.%${q}%,headline.ilike.%${q}%`)
      .order("significance", { ascending: false })
      .limit(8);
    setResults((data as Entry[]) || []);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 200);
    return () => clearTimeout(timeout);
  }, [query, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const typeToPlural: Record<string, string> = {
    token: "tokens",
    character: "characters",
    moment: "moments",
    meme: "memes",
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="glass rounded-full px-5 py-3 flex items-center gap-3">
        <svg
          className="w-4 h-4 text-white/40 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search meme coins, people, moments..."
          className="bg-transparent outline-none text-sm text-white/90 placeholder-white/30 w-full"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full glass-strong rounded-2xl overflow-hidden z-50">
          {results.map((entry) => (
            <button
              key={entry.id}
              className="w-full px-5 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3"
              onClick={() => {
                router.push(`/${typeToPlural[entry.type]}/${entry.slug}`);
                setOpen(false);
                setQuery("");
              }}
            >
              <span className="text-xs uppercase tracking-wider text-white/30 w-20 shrink-0">
                {entry.type}
              </span>
              <span className="text-sm text-white/80 truncate">
                {entry.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
