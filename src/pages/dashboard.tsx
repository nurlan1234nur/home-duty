import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/router";
import Link from "next/link";
import { DayFeed } from "../components/DayFeed";

type TodayItem = {
  assignmentId: string;
  dutyKey: string;
  dutyLabel: string;
  assignedUser: { id: string; name: string };
  status: "pending" | "done";
  doneAt?: string | null;
};

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [date, setDate] = useState<string>("");
  const [items, setItems] = useState<TodayItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  async function load() {
    setErr(null);
    const res = await apiGet("/api/v1/today");
    setDate(res.date);
    setItems(res.items);
  }

  useEffect(() => {
    if (!user) return;
    load().catch((e) => setErr(e?.message ?? "Failed to load"));
  }, [user]);

  async function markDone(assignmentId: string) {
    setBusyId(assignmentId);
    setErr(null);
    try {
      await apiPost(`/api/v1/assignments/${assignmentId}/done`, {});
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await apiPost("/api/v1/auth/logout", {});
    await refresh();
    router.push("/login");
  }

  if (!user) return <p style={{ padding: 16 }}>Loading…</p>;

  return (
    <div className="container">
      <div className="card">
        <div className="cardHeader">
          <div>
            <h1 className="h1">Today ({date})</h1>
            <p className="pMuted">
              Logged in as <b>{user.name}</b>{" "}
              {user.role === "admin" ? <span className="badge">admin</span> : null}
            </p>
          </div>
          <div className="row">
            <Link href="/calendar">Calendar</Link>
            <Link href="/settings">Settings</Link>
            <button className="btn btnDanger" onClick={logout}>Logout</button>
          </div>
        </div>

        {date ? <DayFeed date={date} compact /> : null}
        {err && <div className="alertError">{err}</div>}

        <ul className="list">
          {items.map((it) => {
            const mine = it.assignedUser.id === user.id;
            return (
              <li key={it.assignmentId} className="item">
                <div className="itemTop">
                  <div>
                    <div className="itemTitle">
                      {it.dutyLabel}{" "}
                      {it.status === "done" ? <span className="badge">✅ done</span> : <span className="badge">⏳ pending</span>}
                    </div>
                    <div className="itemMeta">
                      Assigned to <b>{it.assignedUser.name}</b>
                    </div>
                  </div>

                  {mine && it.status !== "done" && (
                    <button
                      className="btn btnPrimary"
                      disabled={busyId === it.assignmentId}
                      onClick={() => markDone(it.assignmentId)}
                    >
                      {busyId === it.assignmentId ? "…" : "Mark done"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
