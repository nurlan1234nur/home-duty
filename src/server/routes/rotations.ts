import { Router } from "express";
import { z } from "zod";
import { authRequired, adminRequired } from "../middleware/auth";
import { dbConnect } from "../db/mongoose";
import { RotationModel } from "../models/Rotation";
import { DutyModel } from "../models/Duty";
import { UserModel } from "../models/User";
import { HOUSEHOLD_ID } from "../config";

export const rotationsRouter = Router();

rotationsRouter.get("/", authRequired, adminRequired, async (req, res) => {
  await dbConnect();
  const rotations = await RotationModel.find({ householdId: HOUSEHOLD_ID }).lean();
  return res.json({
    rotations: rotations.map((r) => ({
      dutyKey: r.dutyKey,
      startDate: r.startDate,
      userOrder: r.userOrder.map((id: any) => String(id))
    }))
  });
});

const RotationUpsertSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  userOrder: z.array(z.string().min(1)).min(1)
});

rotationsRouter.post("/:dutyKey", authRequired, adminRequired, async (req, res) => {
  const dutyKey = String(req.params.dutyKey);
  const body = RotationUpsertSchema.parse(req.body);

  await dbConnect();

  const duty = await DutyModel.findOne({ householdId: HOUSEHOLD_ID, key: dutyKey }).lean();
  if (!duty) return res.status(404).json({ error: "Unknown dutyKey" });

  const users = await UserModel.find({ householdId: HOUSEHOLD_ID }).lean();
  const userSet = new Set(users.map((u) => String(u._id)));

  for (const id of body.userOrder) {
    if (!userSet.has(id)) return res.status(400).json({ error: `Invalid userId in order: ${id}` });
  }

  await RotationModel.findOneAndUpdate(
    { householdId: HOUSEHOLD_ID, dutyKey },
    { $set: { startDate: body.startDate, userOrder: body.userOrder } },
    { upsert: true }
  );

  return res.json({ ok: true });
});
