import { Router } from "express";
import { authRequired } from "../middleware/auth";
import { dbConnect } from "../db/mongoose";
import { HOUSEHOLD_ID } from "../config";
import { ensureAssignmentsForDate, todayISODateInHouseholdTZ } from "../services/scheduler";
import { DutyModel } from "../models/Duty";
import { UserModel } from "../models/User";
import { DutyAssignmentModel } from "../models/DutyAssignment";

export const todayRouter = Router();

todayRouter.get("/", authRequired, async (req, res) => {
  await dbConnect();
  const date = todayISODateInHouseholdTZ();

  // Ensure assignments exist
  await ensureAssignmentsForDate(date);

  const duties = await DutyModel.find({ householdId: HOUSEHOLD_ID, active: true }).lean();
  const dutyMap = new Map(duties.map((d) => [d.key, d.label]));

  const assignments = await DutyAssignmentModel.find({ householdId: HOUSEHOLD_ID, date }).lean();
  const users = await UserModel.find({ householdId: HOUSEHOLD_ID }).lean();
  const userMap = new Map(users.map((u) => [String(u._id), u.name]));

  const items = assignments
    .map((a) => ({
      assignmentId: String(a._id),
      dutyKey: a.dutyKey,
      dutyLabel: dutyMap.get(a.dutyKey) ?? a.dutyKey,
      assignedUser: { id: String(a.assignedUserId), name: userMap.get(String(a.assignedUserId)) ?? "Unknown" },
      status: a.status,
      doneAt: a.doneAt ? a.doneAt.toISOString() : null
    }))
    .sort((x, y) => x.dutyKey.localeCompare(y.dutyKey));

  return res.json({ date, items });
});
