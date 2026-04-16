import { createServerSupabase } from "./supabase-server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;

export async function getSession() {
  const supabase = await createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function isAdmin() {
  const session = await getSession();
  return session?.user?.email === ADMIN_EMAIL;
}
