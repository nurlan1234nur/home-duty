import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/useAuth";
import { apiGet } from "@/lib/api";
import { authFetch } from "@/lib/authFetch";

type Prefs = {
  enabled: boolean;
  types: { note: boolean; photo: boolean; checkin: boolean };
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function NotificationsSettings() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    async function init() {
      if (!user) return;
      try {
        const me = await apiGet("/api/v1/me");
        setPrefs(me.user.notificationPrefs);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load prefs");
      }

      if ("serviceWorker" in navigator && "PushManager" in window) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      }
    }
    init();
  }, [user]);

  async function updatePrefs(next: Partial<Prefs>) {
    if (!prefs) return;
    setBusy(true);
    setErr(null);
    const updated = {
      enabled: next.enabled ?? prefs.enabled,
      types: next.types ?? prefs.types
    };
    try {
      const res = await authFetch("/api/v1/me/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error("Failed to update");
      setPrefs(updated);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  async function enablePush() {
    try {
      setBusy(true);
      setErr(null);
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setErr("Notification permission denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const config = await apiGet("/api/v1/push/config");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey)
      });
      await authFetch("/api/v1/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscription: sub })
      });
      setSubscribed(true);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to enable push");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    try {
      setBusy(true);
      setErr(null);
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await authFetch("/api/v1/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint })
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to disable push");
    } finally {
      setBusy(false);
    }
  }

  if (!user || loading) return <p style={{ padding: 16 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Notifications</h1>
      <p><a href="/settings">← Back</a></p>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div className="card" style={{ padding: 14 }}>
        <div className="row" style={{ alignItems: "center", marginBottom: 12 }}>
          <div style={{ flex: "1 1 auto" }}>
            <div className="h2">Push notifications</div>
            <p className="pMuted" style={{ margin: 0 }}>
              Requires Add to Home Screen on iPhone for best reliability.
            </p>
          </div>
          {subscribed ? (
            <button className="btn" disabled={busy} onClick={disablePush}>
              {busy ? "…" : "Disable"}
            </button>
          ) : (
            <button className="btn btnPrimary" disabled={busy} onClick={enablePush}>
              {busy ? "…" : "Enable"}
            </button>
          )}
        </div>

        {prefs && (
          <>
            <label className="row" style={{ alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={prefs.enabled}
                onChange={(e) => updatePrefs({ enabled: e.target.checked })}
              />
              Enable notifications
            </label>

            <div className="row" style={{ gap: 12, marginTop: 10 }}>
              <label className="row" style={{ alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={prefs.types.note}
                  onChange={(e) =>
                    updatePrefs({ types: { ...prefs.types, note: e.target.checked } })
                  }
                />
                Notes
              </label>
              <label className="row" style={{ alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={prefs.types.photo}
                  onChange={(e) =>
                    updatePrefs({ types: { ...prefs.types, photo: e.target.checked } })
                  }
                />
                Photos
              </label>
              <label className="row" style={{ alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={prefs.types.checkin}
                  onChange={(e) =>
                    updatePrefs({ types: { ...prefs.types, checkin: e.target.checked } })
                  }
                />
                Check-ins
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
