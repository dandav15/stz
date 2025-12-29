"use client";

import { AdminProvider, useAdmin } from "@/components/AdminProvider";
import Link from "next/link";

export default function HomePage() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  return (
    <main className = "page">

      <div className="buttonStack">
          <Link href="/scan" className="cardLink">
            📷 Scan QR
          </Link>

          <Link href="/items" className="cardLink">
            📦 Items
          </Link>

          <Link href="/low-stock" className="cardLink">
            ⚠️ Low stock
          </Link>

         { !adminLoading && isAdmin && (
          <Link href="/admin/items/new" className="cardLink">
            ➕ Add item (admin)
          </Link>
         )}

          <Link
            href="/logout"
            className="cardLink"
            style={{ color: "#f87171", borderColor: "#7f1d1d" }}
          >
            🚪 Logout
          </Link>
      </div>
    </main>
  );
}
