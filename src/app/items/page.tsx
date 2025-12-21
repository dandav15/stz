"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import LogoutButton from "@/components/LogoutButton";

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

      const { data, error } = await supabase
        .from("items")
        .select("id,name,stock_on_hand,active")
        .eq("active", true)
        .order("name");

      if (error) setErr(error.message);
      setItems(data || []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="page">
      <div className="pageContent">
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <h1 className="frostCard">Items</h1>
        </div>

        {/* States */}
        {loading && (
          <div className="frostCard" style={{ marginTop: 14 }}>
            <p style={{ margin: 0, opacity: 0.85 }}>Loading…</p>
          </div>
        )}

        {!loading && err && (
          <div className="frostCard" style={{ marginTop: 14 }}>
            <p style={{ margin: 0, color: "#f87171", fontWeight: 800 }}>{err}</p>
          </div>
        )}

        {!loading && !err && items.length === 0 && (
          <div className="frostCard" style={{ marginTop: 14 }}>
            <p style={{ margin: 0, opacity: 0.85 }}>No items found.</p>
          </div>
        )}

        {/* List */}
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {items.map((i) => (
            <Link
              key={i.id}
              href={`/i/${encodeURIComponent(i.id)}`}
              className="cardLink"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>{i.name}</div>
                  <div style={{ opacity: 0.85 }}>Stock: {i.stock_on_hand}</div>
                </div>

                <div style={{ opacity: 0.75, fontWeight: 900 }}>→</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
