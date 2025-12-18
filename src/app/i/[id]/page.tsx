"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ItemPage() {
  const params = useParams();
  const id = params?.id as string;

  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [pulse, setPulse] = useState(false);
  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  async function load() {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle(); // ✅ no "Cannot coerce..." errors

  if (error) {
    console.error(error);
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
    // Works on most phones; safe no-op on unsupported devices
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([25, 40, 25]);
    }
  }

  function triggerPulse() {
    setPulse(true);
    window.setTimeout(() => setPulse(false), 220);
  }

  async function move(delta: number, btnKey: string) {
    setActiveBtn(btnKey);

    const { error } = await supabase.rpc("apply_movement", {
      p_item_id: id,
      p_delta: delta,
      p_reason: delta > 0 ? "receive" : "issue",
      p_note: null
    });

    // Button glow off (whether success or error)
    window.setTimeout(() => setActiveBtn(null), 160);

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

  if (!item) return <div style={{ padding: 20 }}>Loading…</div>;

if (item.__error) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Problem</h2>
      <p>{item.__error}</p>
      <button onClick={() => router.push("/items")}>Back to items</button>
    </div>
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
    transition: "box-shadow 120ms ease, transform 120ms ease"
  });

  const baseBig = {
    padding: 26,
    fontSize: 26,
    borderRadius: 18,
    color: "#ffffff",
    fontWeight: 850,
    borderWidth: 2,
    borderStyle: "solid",
    width: "100%"
  } as const;

  const baseSmall = {
    padding: 20,
    fontSize: 20,
    borderRadius: 16,
    color: "#ffffff",
    fontWeight: 850,
    borderWidth: 2,
    borderStyle: "solid",
    width: "100%"
  } as const;

  return (
    <main style={{ padding: 20, maxWidth: 520 }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, textAlign: "center" }}>
  {item.name}
</h1>


     <div
  style={{
    marginTop: 10,
    marginBottom: 12,
    padding: "14px 22px",
    borderRadius: 22,
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(6px)",
    boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  }}
>
  <div style={{ fontSize: 15, opacity: 0.75 }}>In stock</div>

  <div
  style={{
    fontSize: 46,
    fontWeight: 950,
    color: "#ffffff",
    lineHeight: 1.05,
    textShadow: stockGlow,
    transform: pulse ? "scale(1.06)" : "scale(1)",
    transition: "transform 180ms ease",
    animation: low ? "breatheRed 2.6s ease-in-out infinite" : "none"
  }}
>
  {item.stock_on_hand}
</div>

</div>


      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        <button
          onClick={() => move(-1, "issue1")}
          style={btnStyle(
            {
              ...baseBig,
              background: "#dc2626",
              borderColor: "#7f1d1d"
            },
            "issue1",
            "0 0 0 4px rgba(255,255,255,0.25), 0 0 18px rgba(220,38,38,0.85)"
          )}
        >
          ➖ ISSUE 1
        </button>

        <button
          onClick={() => move(+1, "recv1")}
          style={btnStyle(
            {
              ...baseBig,
              background: "#16a34a",
              borderColor: "#14532d"
            },
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
              {
                ...baseSmall,
                background: "#b91c1c",
                borderColor: "#7f1d1d"
              },
              "issue5",
              "0 0 0 4px rgba(255,255,255,0.2), 0 0 16px rgba(220,38,38,0.8)"
            )}
          >
            ➖ ISSUE 5
          </button>

          <button
            onClick={() => move(+5, "recv5")}
            style={btnStyle(
              {
                ...baseSmall,
                background: "#15803d",
                borderColor: "#14532d"
              },
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
            background: "#555151ff",
            fontWeight: 800
          }}
        >
          📷 Scan next item
        </button>
      </div>

      {/* Optional: simple dark-ish background so the glow pops more */}
      <style jsx global>{`
        body {
          background: #0b1220;
          color: #ffffff;
        }
        a {
          color: inherit;
          text-decoration: none;
          font-weight: 700;
          border: 1px solid #334155;
          padding: 12px;
          border-radius: 14px;
          display: block;
          background: rgba(255, 255, 255, 0.04);
        }
      `}</style>
      <style jsx>{`
  @keyframes breatheRed {
    0% {
      text-shadow:
        0 0 6px rgba(220,38,38,0.6),
        0 0 14px rgba(220,38,38,0.5);
    }
    50% {
      text-shadow:
        0 0 10px rgba(220,38,38,0.95),
        0 0 22px rgba(220,38,38,0.85);
    }
    100% {
      text-shadow:
        0 0 6px rgba(220,38,38,0.6),
        0 0 14px rgba(220,38,38,0.5);
    }
  }
`}</style>

    </main>
  );
}
