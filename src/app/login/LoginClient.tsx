"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginClient() {
  const searchParams = useSearchParams();

  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function clearOldSupabaseSession() {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("sb-") && key.includes("auth-token")) {
        localStorage.removeItem(key);
      }
    }
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      setErr("Enter email + password first.");
      return;
    }

    setErr("");
    setMsg("");

    if (!remember) clearOldSupabaseSession();

    const supabase = supabaseBrowser(remember);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErr(error.message);
      return;
    }

    const next = searchParams.get("next") || "/";
    window.location.href = next;
  }

  async function signUp() {
    if (!email || !password) {
      setErr("Enter email + password first.");
      return;
    }

    setErr("");
    setMsg("");

    const supabase = supabaseBrowser(remember);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setErr(error.message);
      return;
    }

    setMsg("Account created. If email confirmation is enabled, check your inbox.");
  }

  return (
    <main style={{ padding: 20, maxWidth: 420 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>STZ</h1>
      <p style={{ opacity: 0.7 }}>Sign in to manage stock.</p>

      <form onSubmit={signIn} style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.85 }}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember me
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit">Sign in</button>
          <button type="button" onClick={signUp}>
            Create account
          </button>
        </div>

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {msg && <div style={{ color: "green" }}>{msg}</div>}
      </form>
    </main>
  );
}
