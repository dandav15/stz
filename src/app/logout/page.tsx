"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LogoutPage() {
  useEffect(() => {
    const supabase = supabaseBrowser(true);

    supabase.auth.signOut().finally(() => {
      // Hard reload so cookies + middleware fully reset
      window.location.href = "/login";
    });
  }, []);

  return (
    <main className="frostCard">
      <div className="button">
        <div style={{ fontSize: 18, fontWeight: 900 }}>Signing out…</div>
        <div style={{ marginTop: 6, opacity: 0.75 }}>
          See you in a sec
        </div>
      </div>
    </main>
  );
}
