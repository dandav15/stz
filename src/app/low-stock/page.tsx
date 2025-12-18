"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LowStockPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("items").select("*").then(({ data }) => {
      setItems((data || []).filter(i => i.stock_on_hand <= i.reorder_level));
    });
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Low stock</h1>

      {items.map(i => (
        <div key={i.id} style={{ border: "1px solid #ccc", padding: 10, marginTop: 8 }}>
          {i.name} — {i.stock_on_hand}
        </div>
      ))}
    </main>
  );
}
