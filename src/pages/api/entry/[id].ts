import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { dbConnect } from "@/server/db/mongoose";
import { Entry } from "@/server/models/Entry";

const PatchSchema = z.object({
  text: z.string().optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const id = String(req.query.id || "");
  if (!id) return res.status(400).json({ error: "Missing id" });

  await dbConnect();
  const entry = await Entry.findById(id);
  if (!entry) return res.status(404).json({ error: "Entry not found" });

  if (req.method === "PATCH") {
    const isOwner = String(entry.authorUserId) === user.id;
    if (!isOwner && user.role !== "admin") {
      return res.status(403).json({ error: "Only author or admin can edit" });
    }
    const parsed = PatchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

    const text = (parsed.data.text ?? "").trim();
    if (entry.type === "NOTE" && !text) {
      return res.status(400).json({ error: "Note text is required" });
    }

    entry.text = text || undefined;
    await entry.save();
    return res.json({ ok: true });
  }

  if (req.method === "DELETE") {
    const isOwner = String(entry.authorUserId) === user.id;
    if (!isOwner && user.role !== "admin") {
      return res.status(403).json({ error: "Only author or admin can delete" });
    }
    await entry.deleteOne();
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
