"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ItemsPage() {
  const supabase = supabaseBrowser();

  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");

      // 1) Are we signed in?
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        setErr(`auth.getUser(): ${userErr.message}`);
        setLoading(false);
        return;
      }
      if (!userData?.user) {
        setErr("Not signed in on this device/domain. Go to /login and sign in again.");
        setLoading(false);
        return;
      }

      // 2) Can we SELECT items?
      const { data, error } = await supabase
        .from("items")
        .select("id,name,stock_on_hand,active")
        .eq("active", true)
        .order("name");

      if (error) setErr(`items select: ${error.message}`);
      setItems(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <main style={{ padding: 20, maxWidth: 520 }}>
      <h1>Items</h1>

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: "crimson", fontWeight: 800 }}>{err}</p>}

      {!loading && !err && items.length === 0 && (
        <p style={{ opacity: 0.85 }}>No items returned (but request succeeded).</p>
      )}

      {items.map((i) => (
        <Link key={i.id} href={`/i/${i.id}`}>
          <div style={{ border: "1px solid #334155", padding: 12, marginTop: 10, borderRadius: 14 }}>
            <b>{i.name}</b>
            <div>Stock: {i.stock_on_hand}</div>
          </div>
        </Link>
      ))}
    </main>
  );
}
