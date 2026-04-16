"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/council-of-elders/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="glass rounded-full px-4 py-2 text-xs text-white/40 hover:text-white/70 transition-colors"
    >
      Logout
    </button>
  );
}
