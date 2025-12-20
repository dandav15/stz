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
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      if (!remember) clearOldSupabaseSession();

      const supabase = supabaseBrowser(remember);
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErr(error.message);
        return;
      }

      const next = searchParams.get("next") || "/";
      window.location.href = next;
    } finally {
      setLoading(false);
    }
  }

  async function signUp() {
    if (!email || !password) {
      setErr("Enter email + password first.");
      return;
    }

    setErr("");
    setMsg("");
    setLoading(true);

    try {
      const supabase = supabaseBrowser(remember);
      const { error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setErr(error.message);
        return;
      }

      setMsg("Account created. If email confirmation is enabled, check your inbox.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    border: "1px solid #334155",
    borderRadius: 14,
    padding: "12px 12px",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    outline: "none",
    width: "100%",
  };

  return (
    <main className="page">
      <div className="pageContent">
        <p className="frostCard">
          Sign in to manage stock.
        </p>

        <form className="frostCard" onSubmit={signIn}>

          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ fontSize: 13, opacity: 0.8, fontWeight: 700 }}>
              Email
            </label>
            <input
              placeholder="you@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              style={inputStyle}
            />

            <label style={{ fontSize: 13, opacity: 0.8, fontWeight: 700, marginTop: 6 }}>
              Password
            </label>
            <input
              placeholder="Your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={inputStyle}
            />

            <label
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                opacity: 0.85,
                marginTop: 4,
              }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>

            {err && <div style={{ color: "#f87171", fontWeight: 900 }}>{err}</div>}
            {msg && <div style={{ color: "#4ade80", fontWeight: 900 }}>{msg}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: 16,
                fontSize: 18,
                borderRadius: 16,
                color: "#ffffff",
                fontWeight: 900,
                border: "2px solid #14532d",
                background: loading ? "#0f3d22" : "#16a34a",
                width: "100%",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <button
              type="button"
              onClick={signUp}
              disabled={loading}
              style={{
                padding: 14,
                fontSize: 16,
                borderRadius: 16,
                color: "#e6e6e6",
                border: "2px dashed #6b7280",
                background: "rgba(255,255,255,0.04)",
                fontWeight: 800,
                width: "100%",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Create account
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
