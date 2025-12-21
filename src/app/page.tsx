import Link from "next/link";

export default function HomePage() {
  return (
    <main className = "page">

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
