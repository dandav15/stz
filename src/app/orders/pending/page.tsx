"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type OrderLine = {
  item_id: string;
  qty_ordered: number;
  qty_received: number;
  items?: { name: string }[] | null; // supabase join comes back as array
};

type Order = {
  id: string;
  status: "pending" | "received" | "cancelled";
  created_at: string;
  note?: string | null;
  order_lines?: OrderLine[];
};

function buildEmailDraft(order: Order) {
  const orderRef = String(order.id).slice(0, 8);
  const today = new Date().toISOString().slice(0, 10);

  const lines = (order.order_lines || [])
    .map((l) => `- ${l.items?.[0]?.name || l.item_id} — Qty: ${l.qty_ordered}`)
    .join("\n");

  return `Subject: STZ Stock Order – ${today} – #${orderRef}

Hi,

Please can you supply / quote the following items:

${lines || "(no lines)"}

Thanks,
`;
}

export default function PendingOrdersPage() {
  const supabase = supabaseBrowser();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [copiedId, setCopiedId] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setErr("");

    // ✅ load orders + lines + item names
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id,status,created_at,note,order_lines(item_id,qty_ordered,qty_received,items(name))"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) setErr(error.message);
    setOrders((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyDraft = async (order: Order) => {
    try {
      const text = buildEmailDraft(order);
      await navigator.clipboard.writeText(text);
      setCopiedId(order.id);
      setTimeout(() => setCopiedId(""), 1200);
    } catch {
      setErr("Clipboard copy failed. Try on HTTPS / newer browser.");
    }
  };

  return (
    <main className="page">
      <h1 className="frostCard">Pending orders</h1>

      <div className="buttonStack" style={{ marginTop: 14 }}>
        <Link href="/low-stock" className="appButton" style={{ textAlign: "center" }}>
          ← Back to Low Stock
        </Link>

        <button
          onClick={load}
          className="appButton"
          style={{ textAlign: "center" }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          Loading…
        </div>
      )}

      {!loading && err && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          <div style={{ color: "#f87171", fontWeight: 800 }}>{err}</div>
        </div>
      )}

      {!loading && !err && orders.length === 0 && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          No pending orders.
        </div>
      )}

      {!loading && !err && orders.length > 0 && (
        <div className="buttonStack" style={{ marginTop: 14 }}>
          {orders.map((o) => {
            const lineCount = o.order_lines?.length || 0;

            return (
              <div key={o.id} className="frostCard">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>
                      Order #{String(o.id).slice(0, 8)}
                    </div>
                    <div style={{ opacity: 0.85, marginTop: 4 }}>
                      Lines: {lineCount}
                    </div>
                    {o.note && (
                      <div style={{ opacity: 0.75, marginTop: 4 }}>
                        {o.note}
                      </div>
                    )}
                  </div>

                  <div style={{ fontWeight: 900, color: "#fbbf24" }}>
                    PENDING
                  </div>
                </div>

                {/* Lines preview */}
                {lineCount > 0 && (
                  <div style={{ marginTop: 10, opacity: 0.9, fontSize: 13 }}>
                    {(o.order_lines || []).slice(0, 4).map((l) => (
                      <div key={l.item_id}>
                        • {l.items?.[0]?.name || l.item_id} — {l.qty_ordered}
                      </div>
                    ))}
                    {lineCount > 4 && (
                      <div style={{ opacity: 0.75, marginTop: 4 }}>
                        + {lineCount - 4} more…
                      </div>
                    )}
                  </div>
                )}

                <div className="buttonStack" style={{ marginTop: 12 }}>
                  <button
                    onClick={() => copyDraft(o)}
                    className="appButton"
                    style={{ textAlign: "center" }}
                  >
                    {copiedId === o.id ? "✅ Copied!" : "📋 Copy email draft"}
                  </button>

                  <Link
                    href={`/orders/${encodeURIComponent(o.id)}`}
                    className="appButton"
                    style={{ textAlign: "center" }}
                  >
                    Open order / Receive →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
