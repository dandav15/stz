"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import BackHeader from "@/components/backHeader";

export default function ItemPage() {
  const params = useParams();
  const id = params?.id as string;

  const router = useRouter();
  const supabase = supabaseBrowser();

  const [item, setItem] = useState<any>(null);
  const [pulse, setPulse] = useState(false);
  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      setItem({ __error: error.message });
      return;
    }

    if (!data) {
      setItem({ __error: "Item not found (wrong link/QR, or it was deleted)." });
      return;
    }

    setItem(data);
  }

  function hapticSuccess() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([25, 40, 25]);
    }
  }

  function triggerPulse() {
    setPulse(true);
    setTimeout(() => setPulse(false), 220);
  }

  async function move(delta: number, btnKey: string) {
    setActiveBtn(btnKey);

    const { error } = await supabase.rpc("apply_movement", {
      p_item_id: id,
      p_delta: delta,
      p_reason: delta > 0 ? "receive" : "issue",
      p_note: null,
    });

    setTimeout(() => setActiveBtn(null), 160);

    if (error) {
      alert(error.message);
      return;
    }

    hapticSuccess();
    triggerPulse();
    await load();
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ Loading
  if (!item) {
    return (
      <main className="page">
        <div className="pageContent">
          <div className="frostCard">Loading…</div>
        </div>
      </main>
    );
  }

  // ✅ Error
  if (item.__error) {
    return (
      <main className="page">
        <div className="pageContent">
          <div className="frostCard">
            <h2 style={{ marginTop: 0 }}>Problem</h2>
            <p style={{ opacity: 0.85 }}>{item.__error}</p>

            <button
              onClick={() => router.push("/items")}
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 14,
                border: "1px solid #334155",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                fontWeight: 800,
                width: "100%",
                cursor: "pointer",
              }}
            >
              Back to items
            </button>
          </div>
        </div>
      </main>
    );
  }

  const low = item.stock_on_hand <= item.reorder_level;

  const stockGlow = low
    ? "0 0 8px rgba(220,38,38,0.95), 0 0 18px rgba(220,38,38,0.75)"
    : "0 0 8px rgba(22,163,74,0.95), 0 0 18px rgba(22,163,74,0.75)";

  const btnStyle = (base: any, key: string, glow: string) => ({
    ...base,
    boxShadow: activeBtn === key ? glow : "none",
    transform: activeBtn === key ? "scale(0.99)" : "scale(1)",
    transition: "box-shadow 120ms ease, transform 120ms ease",
  });

  const baseBig = {
    padding: 26,
    fontSize: 26,
    borderRadius: 18,
    color: "#ffffff",
    fontWeight: 850,
    borderWidth: 2,
    borderStyle: "solid",
    width: "100%",
  } as const;

  const baseSmall = {
    padding: 20,
    fontSize: 20,
    borderRadius: 16,
    color: "#ffffff",
    fontWeight: 850,
    borderWidth: 2,
    borderStyle: "solid",
    width: "100%",
  } as const;

  return (
    <main className="page">
      <div className="pageContent">
        <BackHeader title={item.name} backTo=" /items"/>

        {/* Stock display */}
        <div
          className="frostCard"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginTop: 14,
          }}
        >
          <div style={{ fontSize: 15, opacity: 0.75 }}>In stock</div>

          <div
            style={{
              fontSize: 46,
              fontWeight: 950,
              lineHeight: 1.05,
              textShadow: stockGlow,
              transform: pulse ? "scale(1.06)" : "scale(1)",
              transition: "transform 180ms ease",
              animation: low ? "breatheRed 2.6s ease-in-out infinite" : "none",
            }}
          >
            {item.stock_on_hand}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          <button
            onClick={() => move(-1, "issue1")}
            style={btnStyle(
              { ...baseBig, background: "#dc2626", borderColor: "#7f1d1d" },
              "issue1",
              "0 0 0 4px rgba(255,255,255,0.25), 0 0 18px rgba(220,38,38,0.85)"
            )}
          >
            ➖ ISSUE 1
          </button>

          <button
            onClick={() => move(+1, "recv1")}
            style={btnStyle(
              { ...baseBig, background: "#16a34a", borderColor: "#14532d" },
              "recv1",
              "0 0 0 4px rgba(255,255,255,0.25), 0 0 18px rgba(22,163,74,0.85)"
            )}
          >
            ➕ RECEIVE 1
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button
              onClick={() => move(-5, "issue5")}
              style={btnStyle(
                { ...baseSmall, background: "#b91c1c", borderColor: "#7f1d1d" },
                "issue5",
                "0 0 0 4px rgba(255,255,255,0.2), 0 0 16px rgba(220,38,38,0.8)"
              )}
            >
              ➖ ISSUE 5
            </button>

            <button
              onClick={() => move(+5, "recv5")}
              style={btnStyle(
                { ...baseSmall, background: "#15803d", borderColor: "#14532d" },
                "recv5",
                "0 0 0 4px rgba(255,255,255,0.2), 0 0 16px rgba(22,163,74,0.8)"
              )}
            >
              ➕ RECEIVE 5
            </button>
          </div>

          <button
            onClick={() => router.push("/scan")}
            style={{
              marginTop: 10,
              padding: 18,
              fontSize: 18,
              borderRadius: 16,
              color: "#e6e6e6ff",
              border: "2px dashed #6b7280",
              background: "rgba(255,255,255,0.04)",
              fontWeight: 800,
              width: "100%",
              cursor: "pointer",
            }}
          >
            📷 Scan next item
          </button>
        </div>
      </div>
    </main>
  );
}
