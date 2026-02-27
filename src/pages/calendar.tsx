import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import Link from "next/link";

type Summary = Record<string, { NOTE: number; PHOTO: number; CHECKIN: number }>;

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [summary, setSummary] = useState<Summary>({});
  const [err, setErr] = useState<string>("");

  const monthKey = useMemo(() => format(month, "yyyy-MM"), [month]);

  useEffect(() => {
    (async () => {
      setErr("");

      // 1) session байгаа эсэхийг /api/v1/me-ээр шалгана (cookie-оор)
      const me = await fetch("/api/v1/me", { credentials: "include" });
      if (!me.ok) {
        window.location.href = "/login";
        return;
      }

      // 2) summary авах (бас cookie-оор)
      const res = await fetch(`/api/calendar/summary?month=${monthKey}`, {
        credentials: "include",
      });

      if (!res.ok) {
        setErr("Failed to load calendar.");
        return;
      }

      const data = await res.json();
      setSummary(data.days || {});
    })();
  }, [monthKey]);

  const modifiers = useMemo(() => {
    const noteDays: Date[] = [];
    const photoDays: Date[] = [];
    const checkinDays: Date[] = [];

    for (const [d, c] of Object.entries(summary)) {
      const dt = new Date(`${d}T00:00:00`);
      if (c.NOTE > 0) noteDays.push(dt);
      if (c.PHOTO > 0) photoDays.push(dt);
      if (c.CHECKIN > 0) checkinDays.push(dt);
    }
    return { noteDays, photoDays, checkinDays };
  }, [summary]);

  return (
    <div className="container">
      <div className="card">
        <div className="cardHeader">
          <div>
            <h1 className="h1">Calendar</h1>
            <p className="pMuted">Өдөр дээр дарж тухайн өдрийн тэмдэглэл, зураг, check-in-ийг харна.</p>
          </div>
          <div className="row">
            <Link href="/dashboard">Dashboard</Link>
          </div>
        </div>

        {err && <div className="alertError">{err}</div>}

        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="card" style={{ padding: 12, flex: "1 1 520px" }}>
            <DayPicker
              mode="single"
              month={month}
              onMonthChange={setMonth}
              onDayClick={(day) => {
                const d = format(day, "yyyy-MM-dd");
                window.location.href = `/day/${d}`;
              }}
              modifiers={modifiers}
              modifiersClassNames={{
                noteDays: "rdp-day_note",
                photoDays: "rdp-day_photo",
                checkinDays: "rdp-day_checkin",
              }}
            />
          </div>

          <div className="card" style={{ padding: 14, flex: "1 1 280px" }}>
            <div className="h2" style={{ marginTop: 0 }}>Legend</div>
            <div className="row" style={{ marginBottom: 10 }}>
              <span className="badge">📝 Note</span>
              <span className="badge">🖼 Photo</span>
              <span className="badge">✅ Check-in</span>
            </div>
            <p className="small">
              Сар солиход badge-ууд автоматаар шинэчлэгдэнэ.
            </p>
          </div>
        </div>
      </div>

      {/* жижиг CSS override - DayPicker class */}
      <style jsx global>{`
        .rdp { --rdp-cell-size: 42px; }
        .rdp-day_note { outline: 2px solid rgba(110,168,255,.55); outline-offset: -3px; border-radius: 12px; }
        .rdp-day_photo { box-shadow: inset 0 -3px 0 rgba(255,255,255,.22); }
        .rdp-day_checkin { background: rgba(70,209,139,.14); border-radius: 12px; }
      `}</style>
    </div>
  );
}
