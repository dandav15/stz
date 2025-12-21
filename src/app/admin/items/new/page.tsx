"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function NewItemPage() {
  const [name, setName] = useState("");
  const [stock, setStock] = useState<number>(0);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = supabaseBrowser();

  async function create() {
    setErr("");
    setMsg("");

    if (!name.trim()) {
      setErr("Enter an item name.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("items")
        .insert({
          name: name.trim(),
          stock_on_hand: stock,
          reorder_level: 2,
          reorder_qty: 10,
          unit: "each",
          qr_code: crypto.randomUUID(),
          active: true,
        })
        .select("id")
        .single();

      if (error) {
        setErr(error.message);
        return;
      }

      if (data?.id) {
        const url = `${location.origin}/i/${data.id}`;
        setMsg(`Item created. QR URL copied.`);
        await navigator.clipboard.writeText(url);
        alert(`Item created\nQR URL:\n${url}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 className="frostCard">Add item</h1>
      </div>

      <div className="frostCard" style={{ marginTop: 14 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ fontSize: 13, opacity: 0.8, fontWeight: 700 }}>
            Item name
          </label>
          <input
            placeholder="e.g. 2.5mm Twin & Earth"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              border: "1px solid #334155",
              borderRadius: 14,
              padding: "12px 12px",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              outline: "none",
            }}
          />

          <label style={{ fontSize: 13, opacity: 0.8, fontWeight: 700, marginTop: 6 }}>
            Starting stock
          </label>
          <input
            type="number"
            placeholder="0"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            style={{
              border: "1px solid #334155",
              borderRadius: 14,
              padding: "12px 12px",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              outline: "none",
            }}
          />

          {err && <div style={{ color: "#f87171", fontWeight: 800 }}>{err}</div>}
          {msg && <div style={{ color: "#4ade80", fontWeight: 800 }}>{msg}</div>}

          <button
            onClick={create}
            disabled={loading}
            style={{
              marginTop: 6,
              padding: 16,
              fontSize: 18,
              borderRadius: 16,
              color: "#ffffff",
              fontWeight: 900,
              border: "2px solid #14532d",
              background: loading ? "#0f3d22" : "#16a34a",
              width: "100%",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating…" : "➕ Create item"}
          </button>
        </div>
      </div>
    </main>
  );
}
