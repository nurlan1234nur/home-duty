import { useEffect, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { authFetch } from "@/lib/authFetch";

export type Entry = {
  id: string;
  type: "NOTE" | "PHOTO" | "CHECKIN";
  text?: string;
  imageUrl?: string;
  createdAt: string;
  author: { id: string; name: string };
};

type Props = {
  date: string; // "YYYY-MM-DD"
  compact?: boolean; // dashboard дээр жижигрүүлэх бол
};

export function DayFeed({ date, compact }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoCaption, setPhotoCaption] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const { user } = useAuth();

  async function load() {
    if (!date) return;

    setErr("");
    const res = await authFetch(`/api/day/${date}`);
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (!res.ok) {
      setErr("Failed to load day.");
      return;
    }
    const data = await res.json();
    setEntries(data.entries || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function addNote() {
    const text = note.trim();
    if (!date || !text) return;

    setBusy(true);
    setErr("");
    const res = await authFetch(`/api/day/${date}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "NOTE", text }),
    });
    setBusy(false);

    if (res.status === 401) return (window.location.href = "/login");
    if (!res.ok) return setErr("Failed to add note.");

    setNote("");
    await load();
  }

  async function doCheckIn() {
    if (!date) return;

    setBusy(true);
    setErr("");
    const res = await authFetch(`/api/day/${date}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "CHECKIN", text: "Ээлж хийсэн ✅" }),
    });
    setBusy(false);

    if (res.status === 401) return (window.location.href = "/login");
    if (!res.ok) return setErr("Check-in failed.");

    await load();
  }

  async function uploadPhoto(file: File, asCheckin: boolean) {
    if (!date) return;

    setUploading(true);
    setErr("");

    const form = new FormData();
    form.append("file", file);

    const up = await authFetch(`/api/upload`, {
      method: "POST",
      body: form,
    });

    if (up.status === 401) {
      setUploading(false);
      window.location.href = "/login";
      return;
    }
    if (!up.ok) {
      const err = await up.json().catch(() => ({}));
      setUploading(false);
      setErr(err?.error ?? "Upload failed.");
      return;
    }

    const upData = await up.json();
    const url = upData.url as string;

    const body: any = {
      type: asCheckin ? "CHECKIN" : "PHOTO",
      imageUrl: url,
      text: asCheckin ? "Ээлж хийсэн (зураг) ✅" : (photoCaption.trim() || undefined),
    };

    const res = await authFetch(`/api/day/${date}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    setUploading(false);
    setPhotoCaption("");

    if (res.status === 401) return (window.location.href = "/login");
    if (!res.ok) return setErr("Failed to save photo entry.");

    await load();
  }

  async function saveEdit(id: string) {
    const text = editingText.trim();
    const entry = entries.find((x) => x.id === id);
    if (entry?.type === "NOTE" && !text) {
      setErr("Note text is required.");
      return;
    }
    setSavingEdit(true);
    setErr("");
    const res = await authFetch(`/api/entry/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setSavingEdit(false);
    if (res.status === 401) return (window.location.href = "/login");
    if (!res.ok) return setErr("Failed to update note.");

    setEditingId(null);
    setEditingText("");
    await load();
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this entry?")) return;
    setErr("");
    const res = await authFetch(`/api/entry/${id}`, {
      method: "DELETE",
    });
    if (res.status === 401) return (window.location.href = "/login");
    if (!res.ok) return setErr("Failed to delete entry.");
    await load();
  }

  return (
    <div className="card" style={{ padding: 14, marginTop: 14 }}>
      <div className="cardHeader" style={{ marginBottom: 10 }}>
        <div>
          <div className="h2" style={{ marginTop: 0 }}>
            Today activity
          </div>
          <p className="pMuted" style={{ margin: 0 }}>
            Notes / photos / check-ins ({date})
          </p>
        </div>
      </div>

      {err && <div className="alertError">{err}</div>}

      {/* Add controls */}
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 320px" }}>
          <label className="label">Note</label>
          <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btnPrimary" disabled={busy} onClick={addNote}>
              {busy ? "…" : "Add note"}
            </button>
            <button className="btn" disabled={busy} onClick={doCheckIn}>
              {busy ? "…" : "✅ Check-in"}
            </button>
          </div>

          <hr className="hr" />

          <div className="h2">Photo</div>
          <label className="label">Caption (optional)</label>
          <input
            className="input"
            value={photoCaption}
            onChange={(e) => setPhotoCaption(e.target.value)}
            placeholder="Зургийн тайлбар..."
            disabled={uploading}
          />
          <div className="row">
            <label className="btn" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              {uploading ? "Uploading…" : "🖼 Upload photo"}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto(f, false);
                  e.currentTarget.value = "";
                }}
              />
            </label>

            <label className="btn btnPrimary" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              {uploading ? "Uploading…" : "✅ Upload as check-in"}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto(f, true);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {/* Activity list */}
        <div style={{ flex: "2 1 520px" }}>
          {entries.length === 0 ? (
            <p className="small">Одоохондоо юу ч алга байна.</p>
          ) : (
            <ul className="list">
              {entries.slice(0, compact ? 6 : entries.length).map((e) => (
                <li key={e.id} className="item">
                  <div className="itemTop">
                    <div>
                      <div className="itemTitle">
                        {e.type === "NOTE" && "📝 Note"}
                        {e.type === "PHOTO" && "🖼 Photo"}
                        {e.type === "CHECKIN" && "✅ Check-in"}{" "}
                        <span className="badge">{e.author.name}</span>
                      </div>
                      <div className="itemMeta">{new Date(e.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="row" style={{ gap: 6 }}>
                      {user && (user.id === e.author.id || user.role === "admin") ? (
                        editingId === e.id ? null : (
                          <button
                            className="btn"
                            onClick={() => {
                              setEditingId(e.id);
                              setEditingText(e.text || "");
                            }}
                          >
                            Edit
                          </button>
                        )
                      ) : null}
                      {user && (user.id === e.author.id || user.role === "admin") ? (
                        <button className="btn" onClick={() => deleteEntry(e.id)}>
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {editingId === e.id ? (
                    <div style={{ marginTop: 8 }}>
                      <textarea
                        className="textarea"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                      />
                      <div className="row" style={{ marginTop: 8 }}>
                        <button
                          className="btn btnPrimary"
                          disabled={savingEdit}
                          onClick={() => saveEdit(e.id)}
                        >
                          {savingEdit ? "…" : "Save"}
                        </button>
                        <button
                          className="btn"
                          onClick={() => {
                            setEditingId(null);
                            setEditingText("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : e.text ? (
                    <div style={{ marginTop: 8 }}>{e.text}</div>
                  ) : null}

                  {e.imageUrl ? (
                    <div style={{ marginTop: 10 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={e.imageUrl}
                        alt="uploaded"
                        style={{
                          width: "100%",
                          maxHeight: compact ? 260 : 420,
                          objectFit: "cover",
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,.12)",
                        }}
                      />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
