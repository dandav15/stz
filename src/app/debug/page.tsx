export default function DebugPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>STZ Debug</h1>
      <div><b>SUPABASE_URL</b>: {process.env.NEXT_PUBLIC_SUPABASE_URL ?? "MISSING"}</div>
      <div><b>ANON_KEY</b>: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING"}</div>
    </main>
  );
}
