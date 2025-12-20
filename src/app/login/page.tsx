import { Suspense } from "react";
import LoginClient from "@/app/login/LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<main style={{ padding: 20 }}>Loading…</main>}>
      <LoginClient />
    </Suspense>
  );
}
