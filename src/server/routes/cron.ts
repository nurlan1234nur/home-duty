import { Router } from "express";
import { dbConnect } from "../db/mongoose";
import { env, HOUSEHOLD_ID } from "../config";
import { ensureAssignmentsForDate, todayISODateInHouseholdTZ } from "../services/scheduler";
import { DutyAssignmentModel } from "../models/DutyAssignment";
import { DutyModel } from "../models/Duty";
import { UserModel } from "../models/User";
import { sendTelegramMessage } from "../services/telegram";

export const cronRouter = Router();

// Vercel Cron invokes via HTTP GET. Timezone is UTC at scheduling level.
// Protect with Authorization: Bearer <CRON_SECRET>
cronRouter.get("/daily", async (req, res) => {
  const auth = req.header("authorization");
  if (!auth || auth !== `Bearer ${env.CRON_SECRET}`) {
    return res.status(401).json({ ok: false });
  }

  await dbConnect();
  const date = todayISODateInHouseholdTZ();
  await ensureAssignmentsForDate(date);

  const duties = await DutyModel.find({ householdId: HOUSEHOLD_ID, active: true }).lean();
  const dutyLabel = new Map(duties.map((d) => [d.key, d.label]));

  // Acquire "notifiedAt" per assignment to keep idempotency.
  const now = new Date();
  const pendingToNotify = await DutyAssignmentModel.find({ householdId: HOUSEHOLD_ID, date, notifiedAt: { $exists: false } }).lean();

  // Some documents might have null notifiedAt (older versions); treat null as notifyable.
  const nullNotify = await DutyAssignmentModel.find({ householdId: HOUSEHOLD_ID, date, notifiedAt: null }).lean();

  const candidates = [...pendingToNotify, ...nullNotify];

  // Mark as notified first; if send fails, we revert those assignments to null.
  const ids = candidates.map((x) => x._id);
  if (ids.length === 0) return res.json({ ok: true, date, notified: 0 });

  await DutyAssignmentModel.updateMany({ _id: { $in: ids }, notifiedAt: null }, { $set: { notifiedAt: now } }).catch(() => {});
  await DutyAssignmentModel.updateMany({ _id: { $in: ids }, notifiedAt: { $exists: false } }, { $set: { notifiedAt: now } });

  const users = await UserModel.find({ householdId: HOUSEHOLD_ID }).lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const byUser = new Map<string, string[]>();
  for (const a of candidates) {
    const uid = String(a.assignedUserId);
    const label = dutyLabel.get(a.dutyKey) ?? a.dutyKey;
    byUser.set(uid, [...(byUser.get(uid) ?? []), label]);
  }

  let notifiedCount = 0;
  const failedAssignmentIds: any[] = [];

  for (const [uid, labels] of byUser.entries()) {
    const u = userMap.get(uid);
    const chatId = u?.telegram?.chatId;
    if (!chatId) continue;

    const message =
      `🏠 Household duties for ${date}\n` +
      labels.map((l) => `• ${l}`).join("\n") +
      `\n\nOpen: ${env.APP_BASE_URL}/dashboard`;

    try {
      await sendTelegramMessage(chatId, message);
      notifiedCount += labels.length;
    } catch (e) {
      // Revert notifiedAt for this user's assignments so next cron can retry.
      for (const a of candidates) {
        if (String(a.assignedUserId) === uid) failedAssignmentIds.push(a._id);
      }
    }
  }

  if (failedAssignmentIds.length > 0) {
    await DutyAssignmentModel.updateMany({ _id: { $in: failedAssignmentIds } }, { $set: { notifiedAt: null } });
  }

  return res.json({ ok: true, date, notified: notifiedCount, failures: failedAssignmentIds.length });
});
