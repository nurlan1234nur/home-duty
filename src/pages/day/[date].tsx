import { useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { DayFeed } from "../DayFeed";

export default function DayPage() {
  const router = useRouter();
  const date = String(router.query.date || "");
  const title = useMemo(() => (date ? `Day: ${date}` : "Day"), [date]);

  return (
    <div className="container">
      <div className="card">
        <div className="cardHeader">
          <div>
            <h1 className="h1">{title}</h1>
            <p className="pMuted">Энэ өдөр дээр note, зураг, check-in нэмэх боломжтой.</p>
          </div>
          <div className="row">
            <Link href="/calendar">Calendar</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>
        </div>

        {/* Day UI */}
        {date ? <DayFeed date={date} /> : <p style={{ padding: 14 }}>Loading…</p>}
      </div>
    </div>
  );
}