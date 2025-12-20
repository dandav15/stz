import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 20, maxWidth: 520 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>STZ</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Stock tracking
      </p>

      <div className="frostCard" style={{ marginTop: 14 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <Link href="/scan" className="cardLink">
            📷 Scan QR
          </Link>

          <Link href="/items" className="cardLink">
            📦 Items
          </Link>

          <Link href="/low-stock" className="cardLink">
            ⚠️ Low stock
          </Link>

          <Link href="/admin/items/new" className="cardLink">
            ➕ Add item (admin)
          </Link>

          <Link
            href="/logout"
            className="cardLink"
            style={{ color: "#f87171", borderColor: "#7f1d1d" }}
          >
            🚪 Logout
          </Link>
        </div>
      </div>
    </main>
  );
}
