"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("items")
      .select("*")
      .eq("active", true)
      .order("name")
      .then(({ data }) => setItems(data || []));
  }, []);

  return (
    <main style={{ padding: 20, maxWidth: 480 }}>
      <h1>Items</h1>

      {items.map((i) => (
        <Link key={i.id} href={`/i/${i.id}`}>
          <div style={{ border: "1px solid #ccc", padding: 12, marginTop: 10 }}>
            <b>{i.name}</b>
            <div>Stock: {i.stock_on_hand}</div>
          </div>
        </Link>
      ))}
    </main>
  );
}
