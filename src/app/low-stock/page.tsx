"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import LogoutButton from "@/components/LogoutButton";

export default function LowStockPage() {
  const supabase = supabaseBrowser();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data } = await supabase
        .from("items")
        .select("id,name,stock_on_hand,reorder_level")
        .order("name");

      setItems(
        (data || []).filter((i) => i.stock_on_hand <= i.reorder_level)
      );

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 20, maxWidth: 520 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>
          Low stock
        </h1>
        <LogoutButton />
      </div>

      {loading && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          Loading…
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          🎉 All items are above reorder level.
        </div>
      )}

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
              }}
            >
              <div>
                <div style={{ fontWeight: 900 }}>{i.name}</div>
                <div style={{ opacity: 0.85 }}>
                  Stock: {i.stock_on_hand}
                </div>
              </div>

              <div
                style={{
                  fontWeight: 900,
                  color: "#f87171",
                }}
              >
                LOW
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
