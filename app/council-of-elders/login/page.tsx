"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/council-of-elders");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <form
        onSubmit={handleLogin}
        className="glass-strong rounded-2xl p-8 w-full max-w-sm space-y-5"
      >
        <h1 className="text-lg font-semibold text-white/90 text-center">
          Council of Elders
        </h1>

        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full glass rounded-xl py-2.5 text-sm font-medium text-white/70 hover:text-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}
