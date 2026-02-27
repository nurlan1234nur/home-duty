import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Settings() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (!user) return <p style={{ padding: 16 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Settings</h1>
      <p><a href="/dashboard">← Back to dashboard</a></p>

      <h2>Telegram</h2>
      <p><a href="/settings/telegram">Link Telegram and get daily notifications</a></p>

      <h2>Rotations</h2>
      {user.role === "admin" ? (
        <p><a href="/settings/rotations">Configure duty rotations (admin)</a></p>
      ) : (
        <p style={{ color: "#666" }}>Only admins can change rotations.</p>
      )}
    </div>
  );
}
