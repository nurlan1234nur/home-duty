import { useAuth } from "@/lib/useAuth";
import { apiGet, apiPost } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type User = { id: string; name: string };
type Duty = { key: string; label: string };
type Rotation = { dutyKey: string; startDate: string; userOrder: string[] };

export default function Rotations() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [rotations, setRotations] = useState<Record<string, Rotation>>({});
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") router.replace("/settings");
  }, [user, router]);

  async function load() {
    setErr(null);
    const [u, d, r] = await Promise.all([
      apiGet("/api/v1/users"),
      apiGet("/api/v1/duties"),
      apiGet("/api/v1/rotations")
    ]);
    setUsers(u.users);
    setDuties(d.duties);
    const map: Record<string, Rotation> = {};
    for (const item of r.rotations) map[item.dutyKey] = item;
    setRotations(map);
  }

  useEffect(() => {
    load().catch((e) => setErr(e?.message ?? "Failed to load"));
  }, []);

  async function save(dutyKey: string) {
    setErr(null);
    const rot = rotations[dutyKey];
    try {
      await apiPost(`/api/v1/rotations/${dutyKey}`, rot);
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    }
  }

  if (!user) return <p style={{ padding: 16 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Rotations (admin)</h1>
      <p><a href="/settings">← Back</a></p>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {duties.map((duty) => {
        const rot = rotations[duty.key] ?? { dutyKey: duty.key, startDate: "", userOrder: [] };
        return (
          <div key={duty.key} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 12 }}>
            <h3 style={{ marginTop: 0 }}>{duty.label}</h3>

            <label>Start date (YYYY-MM-DD)</label>
            <input
              style={{ width: 220, display: "block", padding: 8, margin: "6px 0 12px" }}
              value={rot.startDate}
              onChange={(e) =>
                setRotations((prev) => ({
                  ...prev,
                  [duty.key]: { ...rot, startDate: e.target.value }
                }))
              }
              placeholder="2026-02-26"
            />

            <label>User order (comma separated user IDs) — simplest editable format</label>
            <textarea
              style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
              rows={2}
              value={rot.userOrder.join(",")}
              onChange={(e) =>
                setRotations((prev) => ({
                  ...prev,
                  [duty.key]: { ...rot, userOrder: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }
                }))
              }
            />

            <details>
              <summary>Show user IDs</summary>
              <ul>
                {users.map((u) => (
                  <li key={u.id}>
                    {u.name}: <code>{u.id}</code>
                  </li>
                ))}
              </ul>
            </details>

            <button onClick={() => save(duty.key)}>Save rotation</button>
          </div>
        );
      })}
    </div>
  );
}
