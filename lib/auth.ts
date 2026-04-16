import { createServerSupabase } from "./supabase-server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;

export async function getUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isAdmin() {
  const user = await getUser();
  return user?.email === ADMIN_EMAIL;
}
