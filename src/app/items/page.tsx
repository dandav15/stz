"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useAdmin } from "@/components/AdminProvider";

type Folder = { id: string; name: string };
type Item = {
  id: string;
  name: string;
  stock_on_hand: number;
  active: boolean;
};

export default function ItemsPage() {
  const supabase = supabaseBrowser();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [items, setItems] = useState<Item[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");

  const [pendingMap, setPendingMap] = useState<Record<string, Set<string>>>({});
  // pendingMap[folderId] => set(item_id), we’ll keep it simple with one map for folder items
  const [folderItemIds, setFolderItemIds] = useState<Set<string> | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function loadAllItems() {
    const { data, error } = await supabase
      .from("items")
      .select("id,name,stock_on_hand,active")
      .eq("active", true)
      .order("name");

    if (error) throw new Error(error.message);
    setItems((data as Item[]) || []);
  }

  async function loadFolders() {
    const { data, error } = await supabase
      .from("folders")
      .select("id,name")
      .order("name");

    if (error) throw new Error(error.message);
    setFolders((data as Folder[]) || []);
  }

  async function loadFolderItemIds(folderId: string) {
    const { data, error } = await supabase
      .from("item_folders")
      .select("item_id")
      .eq("folder_id", folderId);

    if (error) throw new Error(error.message);
    setFolderItemIds(new Set((data || []).map((x: any) => x.item_id)));
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          setErr("Not signed in. Go to /signin and sign in.");
          setLoading(false);
          return;
        }

        await Promise.all([loadAllItems(), loadFolders()]);
        setLoading(false);
      } catch (e: any) {
        setErr(e?.message || "Failed to load.");
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when folder changes, load mapping ids
  useEffect(() => {
    (async () => {
      try {
        setErr("");
        if (selectedFolderId === "all") {
          setFolderItemIds(null);
          return;
        }
        await loadFolderItemIds(selectedFolderId);
      } catch (e: any) {
        setErr(e?.message || "Failed to load folder items.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolderId]);

  const visibleItems = useMemo(() => {
    if (selectedFolderId === "all") return items;
    if (!folderItemIds) return [];
    return items.filter((i) => folderItemIds.has(i.id));
  }, [items, selectedFolderId, folderItemIds]);

  if (adminLoading) {
  return (
    <main className="page">
      <div className="frostCard" style={{ marginTop: 14 }}>Loading…</div>
    </main>
  );
}

  return (
    <main className="page">
      <div className="pageContent">
        <h1 className="frostCard">Items</h1>

        {/* Folder filter bar */}
        <div className="frostCard" style={{ marginTop: 14 }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => setSelectedFolderId("all")}
              style={{
                border: "1px solid #334155",
                background:
                  selectedFolderId === "all"
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(255,255,255,0.04)",
                color: "#fff",
                borderRadius: 999,
                padding: "8px 12px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              All
            </button>

            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFolderId(f.id)}
                style={{
                  border: "1px solid #334155",
                  background:
                    selectedFolderId === f.id
                      ? "rgba(255,255,255,0.10)"
                      : "rgba(255,255,255,0.04)",
                  color: "#fff",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {f.name}
              </button>
            ))}

            { !adminLoading && isAdmin && (
            <Link
              href="/admin/folders"
              className="cardLink"
              style={{ width: "auto", padding: "8px 12px", borderRadius: 999 }}
            >
              ➕ Manage folders
            </Link>
            )}
          </div>
            

          <div style={{ marginTop: 10, opacity: 0.85 }}>
            Showing <b>{visibleItems.length}</b> item(s)
            {selectedFolderId === "all"
              ? ""
              : ` in ${folders.find((f) => f.id === selectedFolderId)?.name || "folder"}`}
            .
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="frostCard" style={{ marginTop: 14 }}>
            Loading…
          </div>
        )}

        {!loading && err && (
          <div className="frostCard" style={{ marginTop: 14 }}>
            <div style={{ margin: 0, color: "#f87171", fontWeight: 800 }}>
              {err}
            </div>
          </div>
        )}

        {!loading && !err && visibleItems.length === 0 && (
          <div className="frostCard" style={{ marginTop: 14 }}>
            No items found.
          </div>
        )}

        {/* List (same style as low-stock buttons) */}
        {!loading && !err && visibleItems.length > 0 && (
          <div className="buttonStack" style={{ marginTop: 14 }}>
            {visibleItems.map((i) => (
              <Link
                key={i.id}
                href={`/i/${encodeURIComponent(i.id)}`}
                className="cardLink"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900 }}>{i.name}</div>
                    <div style={{ opacity: 0.85 }}>
                      Stock: {i.stock_on_hand}
                    </div>
                  </div>

                  <div style={{ fontWeight: 900, opacity: 0.7 }}>→</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
