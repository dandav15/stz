"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  // 👉 THIS LINE is what you asked about
  const supabase = supabaseBrowser();

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function signIn() {
    if (!email || !password) {
      setErr("Enter email + password first.");
      return;
    }

    setErr("");
    setMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) setErr(error.message);
    else router.replace("/");
  }

  async function signUp() {
    if (!email || !password) {
      setErr("Enter email + password first.");
      return;
    }

    setErr("");
    setMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) setErr(error.message);
    else router.replace("/");
  }

  return (
    <main style={{ padding: 20, maxWidth: 420 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>STZ</h1>
      <p style={{ opacity: 0.7 }}>Sign in to manage stock.</p>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={signIn}>Sign in</button>
          <button onClick={signUp}>Create account</button>
        </div>

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {msg && <div style={{ color: "green" }}>{msg}</div>}
      </div>
    </main>
  );
}
