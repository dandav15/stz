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
        setErr("Not signed in. Go to /signin and sign in.");
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
      <div>
        <h1 className="frostCard">Items</h1>
      </div>

      {loading && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          Loading…
        </div>
      )}

      {!loading && err && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          <p style={{ margin: 0, color: "#f87171", fontWeight: 800 }}>{err}</p>
        </div>
      )}

      {!loading && !err && items.length === 0 && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          No items found.
        </div>
      )}

      {!loading && !err && items.length > 0 && (
        <div className="buttonStack" style={{ marginTop: 14 }}>
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
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>{i.name}</div>
                  <div style={{ opacity: 0.85 }}>Stock: {i.stock_on_hand}</div>
                </div>

                <div style={{ fontWeight: 900, opacity: 0.7 }}>→</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
