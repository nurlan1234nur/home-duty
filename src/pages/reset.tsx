import { useState } from "react";
import { useRouter } from "next/router";
import { apiPost } from "@/lib/api";

export default function ResetPassword() {
  const router = useRouter();
  const token = String(router.query.token || "");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await apiPost("/api/v1/auth/reset", { token, password });
      setDone(true);
    } catch (e: any) {
      setErr(e?.message ?? "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="cardHeader">
          <div>
            <h1 className="h1">Set new password</h1>
            <p className="pMuted">Enter a new password to complete reset.</p>
          </div>
        </div>

        {err && <div className="alertError">{err}</div>}

        {done ? (
          <p>Password updated. <a href="/login">Login</a></p>
        ) : (
          <form onSubmit={onSubmit}>
            <label className="label">New password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />

            <div className="row" style={{ marginTop: 14, justifyContent: "space-between" }}>
              <button className="btn btnPrimary" disabled={busy || !token}>
                {busy ? "…" : "Update password"}
              </button>
              <span className="small">
                <a href="/login">Back to login</a>
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
