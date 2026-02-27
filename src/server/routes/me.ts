import { Router } from "express";
import jwt from "jsonwebtoken";
import { authRequired, AuthedRequest } from "../middleware/auth";
import { dbConnect } from "../db/mongoose";
import { UserModel } from "../models/User";
import { env } from "../config";

export const meRouter = Router();

function setTokenCookie(res: any, userId: string) {
  const token = jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: "300d" });
  res.cookie(env.JWT_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 300 * 24 * 60 * 60 * 1000
  });
  return token;
}

meRouter.get("/", authRequired, async (req: AuthedRequest, res) => {
  await dbConnect();
  const user = await UserModel.findById(req.user!.id).lean();
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const token = setTokenCookie(res, String(user._id));
  return res.json({
    token,
    user: {
      id: String(user._id),
      name: user.name,
      nickname: user.nickname || "",
      displayName: user.nickname || user.name,
      notificationPrefs: user.notificationPrefs || {
        enabled: true,
        types: { note: true, photo: true, checkin: true }
      },
      email: user.email,
      role: user.role
    }
  });
});

meRouter.patch("/notifications", authRequired, async (req: AuthedRequest, res) => {
  await dbConnect();
  const user = await UserModel.findById(req.user!.id);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const enabled = req.body?.enabled;
  const types = req.body?.types;

  if (typeof enabled === "boolean") {
    user.notificationPrefs = user.notificationPrefs || { enabled: true, types: { note: true, photo: true, checkin: true } };
    user.notificationPrefs.enabled = enabled;
  }

  if (types && typeof types === "object") {
    user.notificationPrefs = user.notificationPrefs || { enabled: true, types: { note: true, photo: true, checkin: true } };
    user.notificationPrefs.types = {
      note: typeof types.note === "boolean" ? types.note : user.notificationPrefs.types?.note ?? true,
      photo: typeof types.photo === "boolean" ? types.photo : user.notificationPrefs.types?.photo ?? true,
      checkin: typeof types.checkin === "boolean" ? types.checkin : user.notificationPrefs.types?.checkin ?? true
    };
  }

  await user.save();
  const token = setTokenCookie(res, String(user._id));
  return res.json({
    token,
    user: {
      id: String(user._id),
      name: user.name,
      nickname: user.nickname || "",
      displayName: user.nickname || user.name,
      notificationPrefs: user.notificationPrefs,
      email: user.email,
      role: user.role
    }
  });
});
