"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useAdmin } from "@/components/AdminProvider";

type Movement = {
  id: string;
  created_at: string;
  item_id: string;
  user_id: string;
  delta: number;
  reason: string;
  note: string | null;
  item_name: string | null;
  user_full_name: string | null;
};


function fmtWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function dayKey(iso: string) {
  const d = new Date(iso);
  // UK day key: dd/mm/yy
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default function AuditPage() {
  const supabase = supabaseBrowser();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [rows, setRows] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  const [days, setDays] = useState<7 | 30 | 90>(30);

  const toggleDay = (day: string) => {
  setCollapsed((prev) => ({ ...prev, [day]: !prev[day] }));
};



  const load = async () => {
    setLoading(true);
    setErr("");

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
  .from("stock_movements_audit")
  .select("id,created_at,delta,reason,note,item_name,user_full_name")
  .gte("created_at", since)
  .order("created_at", { ascending: false })
  .limit(300);


    if (error) setErr(error.message);
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    

    return rows.filter((r) => {
  const itemName = (r.item_name || "").toLowerCase();
  const who = (r.user_full_name || "").toLowerCase();
  const note = (r.note || "").toLowerCase();
  const reason = (r.reason || "").toLowerCase();
  const delta = String(r.delta);

  return (
    itemName.includes(term) ||
    who.includes(term) ||
    note.includes(term) ||
    reason.includes(term) ||
    delta.includes(term)
  );
});

  }, [rows, q]);

  const grouped = useMemo(() => {
  const map = new Map<string, Movement[]>();

  for (const r of filtered) {
    const key = dayKey(r.created_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  // turn into array so we can render in order (newest day first)
  return Array.from(map.entries());
}, [filtered]);


  // Make audit admin-only (recommended)
  if (!adminLoading && !isAdmin) {
    return (
      <main className="page">
        <div className="frostCard" style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>Admin only</div>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            You don’t have permission to view audit logs.
          </div>
          <Link href="/" className="appButton" style={{ textAlign: "center", marginTop: 12 }}>
            ← Back home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <h1 className="frostCard">Audit</h1>

      <div className="frostCard" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search item / name / note / reason / delta…"
            style={{
              flex: "1 1 240px",
              border: "1px solid #334155",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 12px",
              fontWeight: 800,
              outline: "none",
            }}
          />

          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value) as any)}
            style={{
              border: "1px solid #334155",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 12px",
              fontWeight: 800,
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <button
            className="appButton"
            onClick={load}
            style={{ width: "auto", padding: "10px 14px" }}
          >
            🔄 Refresh
          </button>
        </div>

        <div style={{ marginTop: 10, opacity: 0.85 }}>
          Showing <b>{filtered.length}</b> of <b>{rows.length}</b> (max 300).
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
          No movements found.
        </div>
      )}
    {!loading && !err && grouped.length > 0 && (
  <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
    {grouped.map(([day, dayRows]) => (
      <div key={day}>
        <button
          type="button"
          onClick={() => toggleDay(day)}
          className="appButton"
          style={{
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 950, fontSize: 14, opacity: 0.95 }}>
            {day} • {dayRows.length} movement{dayRows.length === 1 ? "" : "s"}
          </div>

          <div style={{ fontWeight: 950, opacity: 0.85 }}>
            {collapsed[day] ? "▶" : "▼"}
          </div>
        </button>

        {!collapsed[day] && (
          <div className="buttonStack" style={{ marginTop: 10 }}>
            {dayRows.map((r) => {
              const itemName = r.item_name || r.item_id;
              const who = r.user_full_name || r.user_id;
              const when = fmtWhen(r.created_at);

              const isIssue = r.delta < 0;
              const deltaLabel = `${r.delta > 0 ? "+" : ""}${r.delta}`;

              return (
                <div key={r.id} className="frostCard">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {itemName}
                      </div>

                      <div style={{ opacity: 0.85, marginTop: 4 }}>
                        {when} • {who}
                      </div>

                      <div style={{ opacity: 0.75, marginTop: 4 }}>
                        {r.reason}
                        {r.note ? ` • ${r.note}` : ""}
                      </div>
                    </div>

                    <div
                      style={{
                        fontWeight: 950,
                        color: isIssue ? "#f87171" : "#4ade80",
                        minWidth: 70,
                        textAlign: "right",
                      }}
                    >
                      {deltaLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    ))}
  </div>
)}
</main>
  )}   