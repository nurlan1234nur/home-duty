import { useState } from "react";
import { apiPost } from "@/lib/api";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await apiPost("/api/v1/auth/login", { email, password });
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }
  
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="cardHeader">
          <div>
            <h1 className="h1">Login</h1>
            <p className="pMuted">Sign in to manage today’s duties.</p>
          </div>
        </div>

        {err && <div className="alertError">{err}</div>}

        <form onSubmit={onSubmit}>
          <label className="label">Email</label>
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <div className="row" style={{ marginTop: 14, justifyContent: "space-between" }}>
            <button className="btn btnPrimary" disabled={busy}>
              {busy ? "…" : "Login"}
            </button>
            <span className="small">
              No account? <a href="/signup">Sign up</a>
            </span>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <span className="small">
              Forgot password? <a href="/forgot">Reset</a>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
