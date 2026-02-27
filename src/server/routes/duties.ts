import { Router } from "express";
import { authRequired } from "../middleware/auth";
import { dbConnect } from "../db/mongoose";
import { DutyModel } from "../models/Duty";
import { HOUSEHOLD_ID } from "../config";

export const dutiesRouter = Router();

dutiesRouter.get("/", authRequired, async (req, res) => {
  await dbConnect();
  const duties = await DutyModel.find({ householdId: HOUSEHOLD_ID, active: true }).sort({ key: 1 }).lean();
  return res.json({ duties: duties.map((d) => ({ key: d.key, label: d.label })) });
});
