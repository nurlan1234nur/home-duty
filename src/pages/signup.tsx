import { useState } from "react";
import { apiPost } from "@/lib/api";
import { setAuthToken } from "@/lib/authToken";
import { useRouter } from "next/router";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await apiPost("/api/v1/auth/signup", { name, email, password, inviteCode });
      if (res?.token) setAuthToken(res.token);
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e?.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "48px auto", fontFamily: "system-ui" }}>
      <h1>Sign up</h1>
      <p style={{ color: "#444" }}>
        You need the household invite code. Maximum 5 users total.
      </p>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <form onSubmit={onSubmit}>
        <label>Name</label>
        <input
          style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />

        <label>Email</label>
        <input
          style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <label>Invite code</label>
        <input
          style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
        />

        <label>Password</label>
        <input
          style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <button disabled={busy} style={{ padding: "8px 12px" }}>
          {busy ? "…" : "Create account"}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}
