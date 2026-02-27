import { useAuth } from "@/lib/useAuth";
import { apiPost } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function TelegramSettings() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  async function generate() {
    setBusy(true);
    setErr(null);
    try {
      const res = await apiPost("/api/v1/profile/telegram/link-code", {});
      setCode(res.code);
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <p style={{ padding: 16 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Telegram linking</h1>
      <p><a href="/settings">← Back</a></p>

      <p>
        1) Open your Telegram bot (created via BotFather).<br/>
        2) Press Start.<br/>
        3) Send: <code>/link YOUR_CODE</code>
      </p>

      <button onClick={generate} disabled={busy}>
        {busy ? "…" : "Generate link code"}
      </button>

      {code && (
        <p style={{ marginTop: 16 }}>
          Your code (valid ~15 minutes): <b>{code}</b><br/>
          Send this message to the bot: <code>/link {code}</code>
        </p>
      )}

      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </div>
  );
}
