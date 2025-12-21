"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { QRCodeSVG } from "qrcode.react";

type Item = {
  id: string;
  name: string;
  stock_on_hand: number;
  active: boolean;
};

export default function LabelsPage() {
  const supabase = supabaseBrowser();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Optional: filter/search
  const [q, setQ] = useState("");

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
        .select("id,name,stock_on_hand,active")
        .eq("active", true)
        .order("name");

      if (error) setErr(error.message);
      setItems((data as Item[]) || []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => i.name.toLowerCase().includes(s) || i.id.toLowerCase().includes(s));
  }, [items, q]);

  return (
    <main className="page">
      {/* Print styles */}
      <style>{`
        @media print {
          /* Hide app chrome */
          header, footer { display: none !important; }
          .noPrint { display: none !important; }

          /* Make background print clean */
          body { background: white !important; }
          .printArea { padding: 0 !important; }

          /* Labels: A4-friendly grid */
          .labelsGrid {
            gap: 8mm !important;
          }

          .labelCard {
            border: 1px solid #000 !important;
            background: #fff !important;
            color: #000 !important;
            box-shadow: none !important;
          }

          .labelName { color: #000 !important; }
          .labelMeta { color: #000 !important; opacity: 0.8 !important; }
        }
      `}</style>

      <div className="pageContent printArea">
        <h1 className="frostCard">Print QR labels</h1>

        <div className="frostCard noPrint" style={{ marginTop: 14 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search item name or id…"
              style={{
                flex: "1 1 260px",
                border: "1px solid #334155",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                borderRadius: 12,
                padding: "10px 12px",
                fontWeight: 800,
              }}
            />

            <button
              className="cardLink"
              style={{ width: "auto", padding: "10px 14px", fontSize: 14 }}
              onClick={() => window.print()}
            >
              🖨️ Print
            </button>
          </div>

          <div style={{ marginTop: 10, opacity: 0.85 }}>
            QR codes encode the item <b>id</b>. Scanning will take you to <code>/i/&lt;id&gt;</code>.
          </div>
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

        {!loading && !err && filtered.length === 0 && (
          <div className="frostCard" style={{ marginTop: 14 }}>
            No items found.
          </div>
        )}

        {!loading && !err && filtered.length > 0 && (
          <div
            className="labelsGrid"
            style={{
              marginTop: 14,
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {filtered.map((i) => (
              <div
                key={i.id}
                className="labelCard"
                style={{
                  border: "1px solid #334155",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "var(--shadow)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div className="labelName" style={{ fontWeight: 950, color: "#fff" }}>
                      {i.name}
                    </div>
                    <div className="labelMeta" style={{ marginTop: 4, opacity: 0.85, fontWeight: 800 }}>
                      ID: {i.id.slice(0, 8)}…
                    </div>
                    <div className="labelMeta" style={{ marginTop: 4, opacity: 0.85 }}>
                      Stock: {i.stock_on_hand}
                    </div>
                  </div>

                  <div style={{ flex: "0 0 auto" }}>
                    <QRCodeSVG
                      value={i.id}          // ✅ encode item id only
                      size={96}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                </div>

                <div className="noPrint" style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
                  Scan → opens item page
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
