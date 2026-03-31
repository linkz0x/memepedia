import { supabase } from "./supabase";
import { Entry, EntryType } from "./types";

export async function getAllEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .order("significance", { ascending: false });

  if (error) throw error;
  return data as Entry[];
}

export async function getEntriesByType(type: EntryType): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("type", type)
    .order("significance", { ascending: false });

  if (error) throw error;
  return data as Entry[];
}

export async function getEntryBySlug(slug: string): Promise<Entry | null> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Entry;
}

export async function searchEntries(query: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .or(`name.ilike.%${query}%,headline.ilike.%${query}%,tags.cs.{${query}}`)
    .order("significance", { ascending: false })
    .limit(10);

  if (error) throw error;
  return data as Entry[];
}

export async function getEntryByMemeSlug(
  memeSlug: string
): Promise<Entry | null> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("type", "meme")
    .eq("slug", memeSlug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Entry;
}
