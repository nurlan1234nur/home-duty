import { Router } from "express";
import { authRequired, AuthedRequest } from "../middleware/auth";
import { env } from "../config";
import { dbConnect } from "../db/mongoose";
import { PushSubscriptionModel } from "../models/PushSubscription";

export const pushRouter = Router();

pushRouter.get("/config", authRequired, (_req, res) => {
  if (!env.VAPID_PUBLIC_KEY) return res.status(500).json({ error: "Missing VAPID public key" });
  return res.json({ publicKey: env.VAPID_PUBLIC_KEY });
});

pushRouter.post("/subscribe", authRequired, async (req: AuthedRequest, res) => {
  const sub = req.body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return res.status(400).json({ error: "Invalid subscription" });
  }

  await dbConnect();
  await PushSubscriptionModel.findOneAndUpdate(
    { endpoint: sub.endpoint },
    {
      userId: req.user!.id,
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }
    },
    { upsert: true }
  );

  return res.json({ ok: true });
});

pushRouter.post("/unsubscribe", authRequired, async (req: AuthedRequest, res) => {
  const endpoint = req.body?.endpoint;
  if (!endpoint) return res.status(400).json({ error: "Missing endpoint" });
  await dbConnect();
  await PushSubscriptionModel.deleteOne({ endpoint, userId: req.user!.id });
  return res.json({ ok: true });
});
