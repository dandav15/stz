import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 20, maxWidth: 480 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>STZ</h1>
      <p style={{ opacity: 0.7 }}>Stock tracking</p>

      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <Link href="/scan">📷 Scan QR</Link>
        <Link href="/items">📦 Items</Link>
        <Link href="/low-stock">⚠️ Low stock</Link>
        <Link href="/admin/items/new">➕ Add item (admin)</Link>
        <Link href="/logout">🚪 Logout</Link>
      </div>
    </main>
  );
}
