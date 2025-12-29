"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useAdmin } from "@/components/AdminProvider";

type Line = {
  item_id: string;
  qty_ordered: number;
  qty_received: number;
  items?: { name: string }[] | null;
};


export default function OrderDetailPage() {
  const supabase = supabaseBrowser();
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const {isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [receiveNow, setReceiveNow] = useState<Record<string, number>>({});
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr("");

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id,status,created_at,order_lines(item_id,qty_ordered,qty_received,items(name))"
      )
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }
    if (!data) {
      setErr("Order not found.");
      setLoading(false);
      return;
    }

    setOrder(data);

    // default receive amounts = remaining
    const defaults: Record<string, number> = {};
    for (const l of (data.order_lines || []) as Line[]) {
      const remaining = Math.max(0, l.qty_ordered - l.qty_received);
      defaults[l.item_id] = remaining > 0 ? remaining : 0;
    }
    setReceiveNow(defaults);

    setLoading(false);
  };

  useEffect(() => {
    if (orderId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const lines: Line[] = useMemo(() => order?.order_lines || [], [order]);

  const receiveLine = async (itemId: string) => {
    try {
      if (!isAdmin) {
  setErr("Admin only.");
  return;
}

      setErr("");
      const qty = Number(receiveNow[itemId] || 0);
      if (qty <= 0) {
        setErr("Enter a receive quantity > 0.");
        return;
      }

      setBusyItemId(itemId);

      const { error } = await supabase.rpc("receive_order_line", {
        p_order_id: orderId,
        p_item_id: itemId,
        p_qty_received: qty,
      });

      setBusyItemId(null);

      if (error) {
        setErr(error.message);
        return;
      }

      await load();
    } catch (e: any) {
      setBusyItemId(null);
      setErr(e?.message || "Failed receiving.");
    }
  };

  const receiveAll = async () => {
   if (!isAdmin) {
  setErr("Admin only.");
  return;
}
    setErr("");
    // do sequential to keep it simple + readable
    for (const l of lines) {
      const remaining = l.qty_ordered - l.qty_received;
      if (remaining <= 0) continue;

      setReceiveNow((prev) => ({ ...prev, [l.item_id]: remaining }));
      // eslint-disable-next-line no-await-in-loop
      await receiveLine(l.item_id);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <div className="frostCard" style={{ marginTop: 14 }}>
          Loading…
        </div>
      </main>
    );
  }

  if (err && !order) {
    return (
      <main className="page">
        <div className="frostCard" style={{ marginTop: 14 }}>
          <div style={{ color: "#f87171", fontWeight: 800 }}>{err}</div>
          {isAdmin && (
          <button
            className="appButton"
            style={{ marginTop: 12, textAlign: "center" }}
            onClick={() => router.push("/orders/pending")}
          >
            Back to pending orders
          </button>
          )}
        </div>
      </main>
    );
  }

  const isPending = order.status === "pending";
  const showAdminGate = !adminLoading && !isAdmin && isPending;

  return (
    <main className="page">
      <div className="frostCard">
        {showAdminGate && (
  <div className="frostCard" style={{ marginTop: 14 }}>
    <div style={{ fontWeight: 900 }}>Admin only</div>
    <div style={{ opacity: 0.85, marginTop: 6 }}>
      Only admins can receive orders.
    </div>
  </div>
)}

        <div style={{ fontWeight: 900, fontSize: 18 }}>
          Order #{String(order.id).slice(0, 8)}
        </div>
        <div style={{ opacity: 0.85, marginTop: 6 }}>
          Status: <b>{order.status}</b>
        </div>

        {isPending && (
          <div className="buttonStack" style={{ marginTop: 12 }}>
           {isAdmin && (
            <button className="appButton" style={{ textAlign: "center" }} onClick={receiveAll}>
              ✅ Receive all remaining
            </button>
           )}
          </div>
        )}
      </div>

      {err && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          <div style={{ color: "#f87171", fontWeight: 800 }}>{err}</div>
        </div>
      )}

      <div className="buttonStack" style={{ marginTop: 14 }}>
        {lines.map((l) => {
          const remaining = Math.max(0, l.qty_ordered - l.qty_received);
          const done = remaining === 0;

          return (
            <div key={l.item_id} className="cardLink" style={{ cursor: "default" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {l.items?.[0]?.name || l.item_id}

                  </div>
                  <div style={{ opacity: 0.85 }}>
                    Ordered: {l.qty_ordered} • Received: {l.qty_received} • Remaining: {remaining}
                  </div>
                </div>

                <div style={{ fontWeight: 900, color: done ? "#22c55e" : "#fbbf24" }}>
                  {done ? "DONE" : "OPEN"}
                </div>
              </div>

              {isPending && !done && isAdmin && (
  <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <div style={{ opacity: 0.85, fontWeight: 800 }}>Receive now</div>

    <input
      type="number"
      min={1}
      max={remaining}
      value={receiveNow[l.item_id] ?? remaining}
      onChange={(e) =>
        setReceiveNow((prev) => ({ ...prev, [l.item_id]: Number(e.target.value) }))
      }
      className="appButton"
    />

    <button
      className="appButton"
      style={{ width: "auto", padding: "10px 14px", fontSize: 14, textAlign: "center" }}
      disabled={busyItemId === l.item_id}
      onClick={() => receiveLine(l.item_id)}
    >
      {busyItemId === l.item_id ? "Receiving…" : "Receive"}
    </button>
  </div>
)}

            </div>
          );
        })}
      </div>

      <div className="buttonStack" style={{ marginTop: 14 }}>
        {isAdmin && (
        <button className="appButton" style={{ textAlign: "center" }} onClick={() => router.push("/orders/pending")}>
          Back to pending orders
        </button>
        )}
      </div>
    </main>
  );
}
