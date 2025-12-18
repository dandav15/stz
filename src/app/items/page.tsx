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

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setErr("Not signed in. Go to /login and sign in.");
        setLoading(false);
        return;
      }

      // ✅ Explicitly fetch id (and only the fields we need)
      const { data, error } = await supabase
        .from("items")
        .select("id,name,stock_on_hand,active")
        .eq("active", true)
        .order("name");

      if (error) setErr(error.message);
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
        <p style={{ opacity: 0.85 }}>No items found.</p>
      )}

      {items.map((i) => {
        const href = `/i/${i.id}`;
        return (
          <Link key={i.id} href={href}>
            <div
              style={{
                border: "1px solid #334155",
                padding: 12,
                marginTop: 10,
                borderRadius: 14
              }}
            >
              <b>{i.name}</b>
              <div style={{ opacity: 0.9 }}>Stock: {i.stock_on_hand}</div>
              <div style={{ opacity: 0.6, fontSize: 12 }}>ID: {i.id}</div>
            </div>
          </Link>
        );
      })}
    </main>
  );
}
