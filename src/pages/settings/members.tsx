import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/router";

type Member = {
  id: string;
  name: string;
  nickname: string;
  email: string;
  role: "admin" | "member";
};

export default function MembersSettings() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [err, setErr] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setErr("");
    const res = await fetch("/api/v1/users", { credentials: "include" });
    if (res.status === 401) return router.replace("/login");
    if (!res.ok) return setErr("Failed to load users.");
    const data = await res.json();
    setMembers(data.users || []);
  }

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user?.role === "admin") load();
  }, [user, loading, router]);

  async function saveNickname(m: Member) {
    setSavingId(m.id);
    setErr("");
    const res = await fetch(`/api/v1/users/${m.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nickname: m.nickname }),
    });
    setSavingId(null);
    if (!res.ok) return setErr("Failed to update nickname.");
    await load();
  }

  if (!user || loading) return <p style={{ padding: 16 }}>Loading…</p>;
  if (user.role !== "admin") return <p style={{ padding: 16 }}>Admin only.</p>;

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Member Nicknames</h1>
      <p><a href="/settings">← Back to settings</a></p>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div className="card" style={{ padding: 14 }}>
        {members.map((m) => (
          <div key={m.id} className="row" style={{ marginBottom: 10, alignItems: "center" }}>
            <div style={{ flex: "1 1 240px" }}>
              <div style={{ fontWeight: 600 }}>
                {m.name} {m.role === "admin" ? "(admin)" : ""}
              </div>
              <div style={{ color: "#666" }}>{m.email}</div>
            </div>
            <input
              className="input"
              placeholder="Nickname"
              value={m.nickname || ""}
              onChange={(e) => {
                const v = e.target.value;
                setMembers((prev) =>
                  prev.map((x) => (x.id === m.id ? { ...x, nickname: v } : x))
                );
              }}
              style={{ flex: "1 1 220px" }}
            />
            <button
              className="btn btnPrimary"
              disabled={savingId === m.id}
              onClick={() => saveNickname(m)}
            >
              {savingId === m.id ? "…" : "Save"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
