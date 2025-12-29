"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useAdmin } from "@/components/AdminProvider";
import Link from "next/link";

type Folder = { id: string; name: string };

export default function AdminFoldersPage() {
  const supabase = supabaseBrowser();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setErr("");

    const { data, error } = await supabase
      .from("folders")
      .select("id,name")
      .order("name");

    if (error) setErr(error.message);
    setFolders((data as Folder[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!adminLoading && isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminLoading, isAdmin]);

  const addFolder = async () => {
    setErr("");
    const trimmed = name.trim();
    if (!trimmed) return;

    const { error } = await supabase.from("folders").insert({ name: trimmed });
    if (error) {
      setErr(error.message);
      return;
    }
    setName("");
    await load();
  };

  const renameFolder = async (id: string, newName: string) => {
    setErr("");
    const trimmed = newName.trim();
    if (!trimmed) return;

    const { error } = await supabase.from("folders").update({ name: trimmed }).eq("id", id);
    if (error) setErr(error.message);
    await load();
  };

  const deleteFolder = async (id: string) => {
    setErr("");
    if (!confirm("Delete this folder? (Items will just be un-filed)")) return;

    const { error } = await supabase.from("folders").delete().eq("id", id);
    if (error) setErr(error.message);
    await load();
  };

  if (adminLoading) return null;

  if (!isAdmin) {
    return (
      <main className="page">
        <h1 className="frostCard">Manage folders</h1>
        <div className="frostCard" style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900 }}>Admin only</div>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            You don’t have permission to manage folders.
          </div>
          <div className="buttonStack" style={{ marginTop: 12 }}>
            <Link href="/items" className="cardLink" style={{ textAlign: "center" }}>
              ← Back to Items
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <h1 className="frostCard">Manage folders</h1>

      <div className="buttonStack" style={{ marginTop: 14 }}>
        <Link href="/items" className="cardLink" style={{ textAlign: "center" }}>
          ← Back to Items
        </Link>
      </div>

      {err && (
        <div className="frostCard" style={{ marginTop: 14 }}>
          <div style={{ color: "#f87171", fontWeight: 800 }}>{err}</div>
        </div>
      )}

      <div className="frostCard" style={{ marginTop: 14 }}>
  <div style={{ fontWeight: 900, fontSize: 16 }}>Add folder</div>
  <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
    Create categories!
  </div>

  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="e.g. EV, Accessories, etc."
      style={{
        flex: "1 1 220px",
        border: "1px solid #334155",
        background: "rgba(255,255,255,0.04)",
        color: "#fff",
        borderRadius: 14,
        padding: "12px 12px",
        fontWeight: 800,
        outline: "none",
      }}
    />
    <button
      className="cardLink"
      style={{ width: "auto", padding: "12px 14px" }}
      onClick={addFolder}
      disabled={!name.trim()}
    >
      ➕ Add
    </button>
  </div>
</div>


      {loading ? (
        <div className="frostCard" style={{ marginTop: 14 }}>
          Loading…
        </div>
      ) : (
        <div className="buttonStack" style={{ marginTop: 14 }}>
  {folders.map((f) => (
    <div key={f.id} className="cardLink" style={{ cursor: "default" }}>
      {/* Top row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 900 }}>
          {f.name}
        </div>

        <Link
          href={`/admin/folders/${encodeURIComponent(f.id)}`}
          className="cardLink"
          style={{
            width: "auto",
            padding: "10px 14px",
            borderRadius: 999,
          }}
        >
          📦 Edit items →
        </Link>
      </div>

      {/* Rename */}
      <div style={{ marginTop: 10 }}>
        <div style={{ opacity: 0.75, fontWeight: 800, fontSize: 13 }}>
          Rename
        </div>
        <input
          defaultValue={f.name}
          onBlur={(e) => renameFolder(f.id, e.target.value)}
          style={{
            marginTop: 8,
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
      </div>

      {/* Delete */}
      <div style={{ marginTop: 12 }}>
        <button
          className="cardLink"
          style={{
            width: "100%",
            textAlign: "center",
            color: "#f87171",
            borderColor: "#7f1d1d",
          }}
          onClick={() => deleteFolder(f.id)}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  ))}

  {folders.length === 0 && (
    <div className="frostCard">No folders yet — add your first one above.</div>
  )}
</div>


      )}
    </main>
  );
}
