"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import LogoutButton from "@/components/LogoutButton";

export default function NewItemPage() {
  const [name, setName] = useState("");
  const [stock, setStock] = useState(0);
  const supabase = supabaseBrowser();


  async function create() {
    const { data } = await supabase
      .from("items")
      .insert({
        name,
        stock_on_hand: stock,
        reorder_level: 2,
        reorder_qty: 10,
        unit: "each",
        qr_code: crypto.randomUUID(),
        active: true
      })
      .select("id")
      .single();

    if (data) {
      alert(`Item created\nQR URL:\n${location.origin}/i/${data.id}`);
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Add item</h1>
      <LogoutButton/>

      <input placeholder="Name" onChange={e => setName(e.target.value)} />
      <br /><br />
      <input type="number" placeholder="Stock" onChange={e => setStock(+e.target.value)} />
      <br /><br />
      <button onClick={create}>Create</button>
    </main>
  );
}
