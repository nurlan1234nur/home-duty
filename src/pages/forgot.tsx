import { useState } from "react";
import { apiPost } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await apiPost("/api/v1/auth/forgot", { email });
      setDone(true);
    } catch (e: any) {
      setErr(e?.message ?? "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="cardHeader">
          <div>
            <h1 className="h1">Reset password</h1>
            <p className="pMuted">We will send a reset link to your email.</p>
          </div>
        </div>

        {err && <div className="alertError">{err}</div>}
        {done ? (
          <p>If the email exists, a reset link was sent.</p>
        ) : (
          <form onSubmit={onSubmit}>
            <label className="label">Email</label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <div className="row" style={{ marginTop: 14, justifyContent: "space-between" }}>
              <button className="btn btnPrimary" disabled={busy}>
                {busy ? "…" : "Send reset link"}
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
