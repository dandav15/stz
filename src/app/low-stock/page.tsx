"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Item = {
  id: string;
  name: string;
  stock_on_hand: number;
  reorder_level: number;
};

type SelectedLine = {
  item: Item;
  qty_ordered: number;
};

type EmailLine = {
  item_id: string;
  name: string;
  qty_ordered: number;
};

export default function LowStockPage() {
  const supabase = supabaseBrowser();

  const [items, setItems] = useState<Item[]>([]);
  const [pendingItemIds, setPendingItemIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [qty, setQty] = useState<Record<string, number>>({});

  const [createdOrderId, setCreatedOrderId] = useState<string>("");
  const [emailLines, setEmailLines] = useState<EmailLine[]>([]);
  const [creating, setCreating] = useState(false);

  // Load low-stock items
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
        .select("id,name,stock_on_hand,reorder_level")
        .eq("active", true)
        .order("name");

      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      const low =
        (data as Item[] | null)?.filter(
          (i) => i.stock_on_hand <= i.reorder_level
        ) || [];

      // Load pending items (already on pending orders) to prevent duplicates
      const { data: pendingLines, error: pendErr } = await supabase
        .from("order_lines")
        .select("item_name, orders!inner(status)")
        .eq("orders.status", "pending");

      if (pendErr) {
        setErr(pendErr.message);
        setLoading(false);
        return;
      }

      const pendSet = new Set<string>(
        (pendingLines || []).map((x: any) => x.item_id)
      );
      setPendingItemIds(pendSet);

      // Init defaults
      const qtyDefaults: Record<string, number> = {};
      const selDefaults: Record<string, boolean> = {};

      for (const i of low) {
        const suggested = Math.max(1, i.reorder_level - i.stock_on_hand + 1);
        qtyDefaults[i.id] = suggested;
        selDefaults[i.id] = false;
      }

      setQty(qtyDefaults);
      setSelected(selDefaults);
      setItems(low);

      setCreatedOrderId("");
      setEmailLines([]);

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedLines: SelectedLine[] = useMemo(() => {
    return items
      .filter((i) => selected[i.id])
      .map((i) => ({
        item: i,
        qty_ordered: Math.max(1, Number(qty[i.id] || 1)),
      }));
  }, [items, selected, qty]);

  // ✅ Fetch order lines after creation so email uses names from DB (reliable)
  async function loadEmailLines(orderId: string) {
    setErr("");

    const { data, error } = await supabase
      .from("order_lines")
      .select("item_name, qty_ordered, item:items(name)")
      .eq("order_id", orderId);

    if (error) {
      setErr(error.message);
      setEmailLines([]);
      return;
    }

    const mapped: EmailLine[] = (data || []).map((l: any) => ({
      item_id: l.item_id,
      name: l.item?.name ?? "",
      qty_ordered: Number(l.qty_ordered ?? 0),
    }));

    setEmailLines(mapped);
  }

  const emailDraft = useMemo(() => {
    if (!createdOrderId) return "";

    const orderRef = createdOrderId.slice(0, 8);
    const today = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }
  ).slice(0, 10);

    const lines =
      emailLines.length > 0
        ? emailLines
            .map(
              (l) =>
                `- ${l.name || `Item ${l.item_id.slice(0, 8)}`} — Qty: ${
                  l.qty_ordered
                }`
            )
            .join("\n")
        : "(No lines found for this order)";

    return `Subject: Downlight Electrical Stock Order – ${today} – #${orderRef}

Hi,

Please can you supply / quote the following items:

${lines}

Thanks,
`;
  }, [createdOrderId, emailLines]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const createPendingOrder = async () => {
    setErr("");
    setCreatedOrderId("");
    setEmailLines([]);

    if (selectedLines.length === 0) {
      setErr("Select at least one item.");
      return;
    }

    // Prevent ordering items already pending
    const hasPendingSelected = selectedLines.some((l) =>
      pendingItemIds.has(l.item.id)
    );
    if (hasPendingSelected) {
      setErr("One or more selected items are already pending.");
      return;
    }

    setCreating(true);

    try {
      const payload = selectedLines.map((l) => ({
        item_id: l.item.id,
        qty_ordered: l.qty_ordered,
      }));

      const { data, error } = await supabase.rpc("create_pending_order", {
        p_lines: payload,
        p_note: "Created from Low Stock page",
      });

      if (error) {
        setErr(error.message);
        return;
      }

      const newOrderId = String(data);
      setCreatedOrderId(newOrderId);

      // ✅ Load real lines + names from DB for the email draft
      await loadEmailLines(newOrderId);

      // Update local pending set so UI disables immediately
      setPendingItemIds((prev) => {
        const next = new Set(prev);
        for (const l of selectedLines) next.add(l.item.id);
        return next;
      });

      // Clear selection after creating
      setSelected((prev) => {
        const next = { ...prev };
        for (const l of selectedLines) next[l.item.id] = false;
        return next;
      });
    } finally {
      setCreating(false);
    }
  };

  const copyEmail = async () => {
    if (!emailDraft) return;

    try {
      await navigator.clipboard.writeText(emailDraft);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = emailDraft;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

  return (
    <main className="page">
      <h1 className="frostCard">Low stock</h1>

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

      {!loading && !err && items.length === 0 && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          🎉 All items are above reorder level.
        </div>
      )}

      {!loading && !err && items.length > 0 && (
        <>
          {/* Actions */}
          <div className="frostCard" style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                className="appButton"
                style={{ width: "auto", padding: "10px 14px", fontSize: 14 }}
                onClick={createPendingOrder}
                disabled={creating}
              >
                {creating ? "Creating…" : "🧾 Create pending order"}
              </button>

              <Link
                href="/orders/pending"
                className="appButton"
                style={{ width: "auto", padding: "10px 14px", fontSize: 14 }}
              >
                📦 Pending orders →
              </Link>

              <div style={{ opacity: 0.85 }}>
                Selected: <b>{selectedLines.length}</b>
              </div>
            </div>

            {createdOrderId && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 900 }}>
                  Pending order created: #{createdOrderId.slice(0, 8)}
                </div>

                <div className="buttonStack" style={{ marginTop: 10 }}>
                  <button
                    className="appButton"
                    onClick={copyEmail}
                    style={{ textAlign: "center" }}
                  >
                    📋 Copy email draft
                  </button>
                </div>

                <pre
                  style={{
                    marginTop: 10,
                    whiteSpace: "pre-wrap",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid #334155",
                    borderRadius: 14,
                    padding: 12,
                    color: "#fff",
                    fontSize: 13,
                    opacity: 0.95,
                  }}
                >
                  {emailDraft}
                </pre>
              </div>
            )}
          </div>

          {/* List */}
          <div className="buttonStack" style={{ marginTop: 14 }}>
            {items.map((i) => {
              const isPending = pendingItemIds.has(i.id);
              const isChecked = !!selected[i.id];

              return (
                <div
                  key={i.id}
                  className="cardLink"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    opacity: isPending ? 0.65 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isPending}
                      onChange={() => toggleSelected(i.id)}
                      style={{ transform: "scale(1.15)" }}
                    />

                    <Link
                      href={`/i/${encodeURIComponent(i.id)}`}
                      style={{
                        textDecoration: "none",
                        color: "#fff",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {i.name}
                      </div>
                      <div style={{ opacity: 0.85 }}>
                        Stock: {i.stock_on_hand} / Reorder: {i.reorder_level}
                      </div>
                    </Link>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ opacity: 0.85, fontWeight: 800 }}>Order</div>
                    <input
                      type="number"
                      min={1}
                      value={qty[i.id] ?? 1}
                      disabled={isPending}
                      onChange={(e) =>
                        setQty((prev) => ({
                          ...prev,
                          [i.id]: Number(e.target.value),
                        }))
                      }
                      style={{
                        width: 76,
                        border: "1px solid #334155",
                        background: "rgba(255,255,255,0.04)",
                        color: "#fff",
                        borderRadius: 12,
                        padding: "8px 10px",
                        fontWeight: 900,
                      }}
                    />

                    <div
                      style={{
                        fontWeight: 900,
                        color: isPending ? "#fbbf24" : "#f87171",
                      }}
                    >
                      {isPending ? "PENDING" : "LOW"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
