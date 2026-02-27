import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { dbConnect } from "@/server/db/mongoose";
import { Entry } from "@/server/models/Entry";
import { requireUser } from "@/server/auth";
import { notifyEntryCreated } from "@/server/services/notifications";

const postSchema = z.object({
  type: z.enum(["NOTE", "PHOTO", "CHECKIN"]),
  text: z.string().optional(),
  imageUrl: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const date = String(req.query.date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
  }

  await dbConnect();

  if (req.method === "GET") {
    const entries = await Entry.find({ date })
      .populate("authorUserId", "name nickname")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      date,
      entries: entries.map((e: any) => ({
        id: String(e._id),
        type: e.type,
        text: e.text || "",
        imageUrl: e.imageUrl || "",
        createdAt: e.createdAt,
        author: {
          id: String(e.authorUserId?._id),
          name: e.authorUserId?.nickname || e.authorUserId?.name || "Unknown"
        },
      })),
    });
  }

  if (req.method === "POST") {
    const parsed = postSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

    const created = await Entry.create({
      date,
      type: parsed.data.type,
      text: parsed.data.text,
      imageUrl: parsed.data.imageUrl,
      authorUserId: user.id,
    });

    notifyEntryCreated({
      authorUserId: user.id,
      authorName: user.name,
      date,
      type: parsed.data.type,
      text: parsed.data.text
    }).catch(() => {});

    return res.json({ ok: true, id: String(created._id) });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
