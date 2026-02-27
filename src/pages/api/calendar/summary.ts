import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "@/server/db/mongoose";
import { Entry } from "@/server/models/Entry";
import { requireUser } from "@/server/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const month = String(req.query.month || ""); // YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "Invalid month format. Use YYYY-MM" });
  }

  const start = `${month}-01`;
  const end = `${month}-31`;

  await dbConnect();

  // group by date + type counts
  const agg = await Entry.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { date: "$date", type: "$type" },
        count: { $sum: 1 },
      },
    },
  ]);

  const map: Record<string, { NOTE: number; PHOTO: number; CHECKIN: number }> = {};
  for (const row of agg) {
    const d = row._id.date as string;
    const t = row._id.type as "NOTE" | "PHOTO" | "CHECKIN";
    map[d] = map[d] || { NOTE: 0, PHOTO: 0, CHECKIN: 0 };
    map[d][t] = row.count;
  }

  return res.json({ month, days: map });
}