"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useAdmin } from "@/components/AdminProvider";

type Folder = { id: string; name: string };
type Item = { id: string; name: string; stock_on_hand: number };

export default function FolderItemsPage() {
  const supabase = supabaseBrowser();
  const params = useParams();
  const folderId = params?.id as string;

  const { isAdmin, loading: adminLoading } = useAdmin();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [onlyInFolder, setOnlyInFolder] = useState(false);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr("");

    const { data: f, error: fErr } = await supabase
      .from("folders")
      .select("id,name")
      .eq("id", folderId)
      .maybeSingle();

    if (fErr) {
      setErr(fErr.message);
      setLoading(false);
      return;
    }
    if (!f) {
      setErr("Folder not found.");
      setLoading(false);
      return;
    }
    setFolder(f);

    const { data: it, error: itErr } = await supabase
      .from("items")
      .select("id,name,stock_on_hand")
      .eq("active", true)
      .order("name");

    if (itErr) {
      setErr(itErr.message);
      setLoading(false);
      return;
    }
    setItems((it as Item[]) || []);

    const { data: links, error: lErr } = await supabase
      .from("item_folders")
      .select("item_id")
      .eq("folder_id", folderId);

    if (lErr) {
      setErr(lErr.message);
      setLoading(false);
      return;
    }

    setLinkedIds(new Set((links || []).map((x: any) => x.item_id)));
    setLoading(false);
  };

  useEffect(() => {
    if (!adminLoading && isAdmin && folderId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminLoading, isAdmin, folderId]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    let base = items;

    if (onlyInFolder) {
      base = base.filter((i) => linkedIds.has(i.id));
    }

    if (!term) return base;

    return base.filter((i) => i.name.toLowerCase().includes(term));
  }, [items, q, onlyInFolder, linkedIds]);

  const toggle = async (itemId: string) => {
    setErr("");
    setBusyId(itemId);

    const isLinked = linkedIds.has(itemId);

    if (isLinked) {
      const { error } = await supabase
        .from("item_folders")
        .delete()
        .eq("folder_id", folderId)
        .eq("item_id", itemId);

      if (error) {
        setErr(error.message);
        setBusyId(null);
        return;
      }

      setLinkedIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    } else {
      const { error } = await supabase
        .from("item_folders")
        .insert({ folder_id: folderId, item_id: itemId });

      if (error) {
        setErr(error.message);
        setBusyId(null);
        return;
      }

      setLinkedIds((prev) => {
        const next = new Set(prev);
        next.add(itemId);
        return next;
      });
    }

    setBusyId(null);
  };

  if (adminLoading) return null;

  if (!isAdmin) {
    return (
      <main className="page">
        <h1 className="frostCard">Folder items</h1>
        <div className="frostCard" style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>Admin only</div>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            You don’t have permission to edit folders.
          </div>
          <div className="buttonStack" style={{ marginTop: 12 }}>
            <Link href="/admin/folders" className="cardLink" style={{ textAlign: "center" }}>
              ← Back
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <h1 className="frostCard">
        {folder ? folder.name : "Folder"}
      </h1>

      <div className="buttonStack" style={{ marginTop: 14 }}>
        <Link href="/admin/folders" className="cardLink" style={{ textAlign: "center" }}>
          ← Back to folders
        </Link>

        <button className="appButton" style={{ textAlign: "center" }} onClick={load}>
          🔄 Refresh
        </button>
      </div>

      {err && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          <div style={{ color: "#f87171", fontWeight: 800 }}>{err}</div>
        </div>
      )}

      {/* Search + filters (frost style) */}
      <div className="frostCard" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Find items</div>
            <div style={{ opacity: 0.75, fontSize: 13, marginTop: 6 }}>
              Tap an item to add/remove it from this folder.
            </div>
          </div>

          <div style={{ fontWeight: 900, opacity: 0.85 }}>
            {linkedIds.size} in folder
          </div>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          style={{
            marginTop: 12,
            width: "100%",
            border: "1px solid #334155",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
            borderRadius: 14,
            padding: "12px 12px",
            fontWeight: 800,
            outline: "none",
          }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <button
            type="button"
            onClick={() => setOnlyInFolder(false)}
            style={{
              border: "1px solid #334155",
              background: !onlyInFolder ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: "#fff",
              borderRadius: 999,
              padding: "10px 12px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            All items
          </button>

          <button
            type="button"
            onClick={() => setOnlyInFolder(true)}
            style={{
              border: "1px solid #334155",
              background: onlyInFolder ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: "#fff",
              borderRadius: 999,
              padding: "10px 12px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            In this folder
          </button>
        </div>
      </div>

      {/* List (buttonStack + cardLink style) */}
      {loading ? (
        <div className="frostCard" style={{ marginTop: 14 }}>
          Loading…
        </div>
      ) : (
        <div className="buttonStack" style={{ marginTop: 14 }}>
          {filtered.map((i) => {
            const active = linkedIds.has(i.id);
            const busy = busyId === i.id;

            return (
              <button
                key={i.id}
                type="button"
                onClick={() => toggle(i.id)}
                disabled={busy}
                className="appButton"
                style={{
                  textAlign: "left",
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.75 : 1,
                  borderColor: active ? "#22c55e" : "#334155",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 900,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }}
>
  <span
    style={{
      width: 12,
      height: 12,
      borderRadius: 999,
      background: active ? "#22c55e" : "rgba(255,255,255,0.25)",
      boxShadow: active ? "0 0 10px rgba(34,197,94,0.7)" : "none",
      flexShrink: 0,
    }}
  />
  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
    {i.name}
  </span>
</div>

                    <div style={{ opacity: 0.85 }}>Stock: {i.stock_on_hand}</div>
                  </div>

                  <div
                    style={{
                      fontWeight: 900,
                      color: active ? "#22c55e" : "rgba(255,255,255,0.65)",
                      minWidth: 58,
                      textAlign: "right",
                    }}
                  >
                    {busy ? "…" : active ? "IN" : "ADD"}
                  </div>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="frostCard">
              No items match your search.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
