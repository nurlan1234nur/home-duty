import { DateTime } from "luxon";
import { HOUSEHOLD_ID, env } from "../config";
import { DutyModel } from "../models/Duty";
import { RotationModel } from "../models/Rotation";
import { UserModel } from "../models/User";
import { DutyAssignmentModel } from "../models/DutyAssignment";

export function todayISODateInHouseholdTZ() {
  return DateTime.now().setZone(env.HOUSEHOLD_TIMEZONE).toISODate()!;
}

function rotationIndex(dateISO: string, startDateISO: string, count: number) {
  const zone = env.HOUSEHOLD_TIMEZONE;
  const d = DateTime.fromISO(dateISO, { zone }).startOf("day");
  const s = DateTime.fromISO(startDateISO, { zone }).startOf("day");
  const diffDays = Math.floor(d.diff(s, "days").days);
  const raw = diffDays % count;
  return raw < 0 ? raw + count : raw;
}

export async function ensureAssignmentsForDate(dateISO: string) {
  const duties = await DutyModel.find({ householdId: HOUSEHOLD_ID, active: true }).lean();
  const users = await UserModel.find({ householdId: HOUSEHOLD_ID })
    .sort({ createdAt: 1 })
    .lean();

  if (users.length === 0) return [];

  const rotations = await RotationModel.find({ householdId: HOUSEHOLD_ID }).lean();
  const rotationMap = new Map<string, any>();
  for (const r of rotations) rotationMap.set(r.dutyKey, r);

  const assignments: any[] = [];

  for (const duty of duties) {
    const rot = rotationMap.get(duty.key);
    const userOrder: string[] =
      rot?.userOrder?.length > 0 ? rot.userOrder.map((id: any) => String(id)) : users.map((u) => String(u._id));

    const startDate = rot?.startDate ?? dateISO;
    const idx = rotationIndex(dateISO, startDate, userOrder.length);
    const assignedUserId = userOrder[idx];

    // Upsert duty assignment (do not overwrite done assignments)
    const doc = await DutyAssignmentModel.findOneAndUpdate(
      { householdId: HOUSEHOLD_ID, dutyKey: duty.key, date: dateISO },
      {
        $setOnInsert: {
          householdId: HOUSEHOLD_ID,
          dutyKey: duty.key,
          date: dateISO,
          assignedUserId,
          status: "pending"
        }
      },
      { upsert: true, new: true }
    ).lean();

    assignments.push(doc);
  }

  return assignments;
}
