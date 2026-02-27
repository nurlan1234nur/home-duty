import webpush from "web-push";
import { env } from "../config";
import { dbConnect } from "../db/mongoose";
import { PushSubscriptionModel } from "../models/PushSubscription";
import { UserModel } from "../models/User";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return true;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  vapidConfigured = true;
  return true;
}

type EntryType = "NOTE" | "PHOTO" | "CHECKIN";

export async function notifyEntryCreated(opts: {
  authorUserId: string;
  authorName: string;
  date: string;
  type: EntryType;
  text?: string;
}) {
  if (!ensureVapid()) return;

  await dbConnect();

  const users = await UserModel.find({}).lean();
  const targets = users.filter((u: any) => {
    if (String(u._id) === opts.authorUserId) return false;
    const prefs = u.notificationPrefs || {};
    if (prefs.enabled === false) return false;
    const types = prefs.types || {};
    if (opts.type === "NOTE" && types.note === false) return false;
    if (opts.type === "PHOTO" && types.photo === false) return false;
    if (opts.type === "CHECKIN" && types.checkin === false) return false;
    return true;
  });

  if (targets.length === 0) return;

  const subs = await PushSubscriptionModel.find({
    userId: { $in: targets.map((u: any) => u._id) }
  }).lean();

  if (subs.length === 0) return;

  const typeLabel = opts.type === "NOTE" ? "note" : opts.type === "PHOTO" ? "photo" : "check-in";
  const title = `${opts.authorName} added a ${typeLabel}`;
  const body = opts.text ? opts.text : typeLabel === "photo" ? "Photo uploaded" : "New activity";

  const payload = JSON.stringify({
    title,
    body,
    url: `/day/${opts.date}`
  });

  await Promise.all(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          payload
        );
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          await PushSubscriptionModel.deleteOne({ endpoint: sub.endpoint });
        }
      }
    })
  );
}
