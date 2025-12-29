"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useAdmin } from "@/components/AdminProvider";

export default function ItemPage() {
  const params = useParams();
  const id = params?.id as string;

  const router = useRouter();
  const supabase = supabaseBrowser();

  const [item, setItem] = useState<any>(null);
  const [pulse, setPulse] = useState(false);
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [folders, setFolders] = useState<any[]>([]);
  const [itemFolderIds, setItemFolderIds] = useState<Set<string>>(new Set());
  const [folderBusy, setFolderBusy] = useState(false);


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

  async function toggleFolder(folderId: string, checked: boolean) {
  setFolderBusy(true);

  if (checked) {
    const { error } = await supabase
      .from("item_folders")
      .insert({ item_id: id, folder_id: folderId });

    if (error) {
      alert(error.message);
      setFolderBusy(false);
      return;
    }

    setItemFolderIds((prev) => new Set(prev).add(folderId));
  } else {
    const { error } = await supabase
      .from("item_folders")
      .delete()
      .eq("item_id", id)
      .eq("folder_id", folderId);

    if (error) {
      alert(error.message);
      setFolderBusy(false);
      return;
    }

    setItemFolderIds((prev) => {
      const next = new Set(prev);
      next.delete(folderId);
      return next;
    });
  }

  setFolderBusy(false);
}


  async function loadFoldersAndLinks() {
  const { data: fData, error: fErr } = await supabase
    .from("folders")
    .select("id,name")
    .order("name");

  if (fErr) return;

  setFolders(fData || []);

  const { data: links, error: lErr } = await supabase
    .from("item_folders")
    .select("folder_id")
    .eq("item_id", id);

  if (lErr) return;

  setItemFolderIds(new Set((links || []).map((x: any) => x.folder_id)));
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

  // ✅ optimistic UI (instant feedback)
  setItem((prev: any) => (prev ? { ...prev, stock_on_hand: prev.stock_on_hand + delta } : prev));

  const { error } = await supabase.rpc("apply_movement", {
    p_item_id: id,
    p_delta: delta,
    p_reason: delta > 0 ? "receive" : "issue",
    p_note: null,
  });

  setTimeout(() => setActiveBtn(null), 160);

  if (error) {
    // rollback if it failed
    await load();
    alert(error.message);
    return;
  }

  hapticSuccess();
  triggerPulse();
  await load();
}
 

  useEffect(() => {
    if (id) {
      load();
      if (!adminLoading && isAdmin) loadFoldersAndLinks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, adminLoading, isAdmin]);

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

{/* Admin: folder assignment (prettier) */}
{!adminLoading && isAdmin && (
  <div className="frostCard" style={{ marginTop: 14 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 16 }}>Folders</div>

      <div style={{ opacity: 0.75, fontWeight: 800 }}>
        {folderBusy ? "Saving…" : `${itemFolderIds.size} selected`}
      </div>
    </div>

    <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
      Tap to add/remove this item from folders.
    </div>

    {folders.length === 0 ? (
      <div style={{ marginTop: 12, opacity: 0.85 }}>
        No folders yet. Create some in <b>Admin → Folders</b>.
      </div>
    ) : (
      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {folders.map((f) => {
          const active = itemFolderIds.has(f.id);

          return (
            <button
              key={f.id}
              type="button"
              disabled={folderBusy}
              onClick={() => toggleFolder(f.id, !active)}
              style={{
                border: "1px solid #334155",
                background: active
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(255,255,255,0.04)",
                color: "#fff",
                borderRadius: 999,
                padding: "10px 12px",
                fontWeight: 900,
                cursor: folderBusy ? "not-allowed" : "pointer",
                opacity: folderBusy ? 0.7 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: active ? "0 0 0 3px rgba(255,255,255,0.12)" : "none",
                transition: "box-shadow 140ms ease, transform 140ms ease",
                transform: active ? "scale(0.99)" : "scale(1)",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: active ? "#22c55e" : "rgba(255,255,255,0.25)",
                  boxShadow: active ? "0 0 10px rgba(34,197,94,0.6)" : "none",
                }}
              />
              {f.name}
            </button>
          );
        })}
      </div>
    )}
  </div>
)}



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
