"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <main className="w-full px-4 md:px-8 pt-20 md:pt-24 pb-20">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError(null);
          try {
            const response = await fetch("/api/admin/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Wrong password.");
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Wrong password.");
            setBusy(false);
          }
        }}
        className="w-full max-w-[400px] mx-auto"
      >
        <h1 className="text-[28px] md:text-[36px] font-semibold tracking-tight text-foreground">
          Admin
        </h1>
        <p className="mt-2 text-[15px] text-secondary">Sign in to replace a listing logo.</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="mt-6 w-full rounded-full border border-border bg-white/70 px-4 py-2.5 text-sm font-medium outline-none focus:border-accent"
        />

        {error && (
          <p className="mt-3 text-[13px] font-medium text-accent-dark">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
        >
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Sign in
        </button>
      </form>
    </main>
  );
}
