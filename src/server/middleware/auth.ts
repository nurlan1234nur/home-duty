import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config";
import { UserModel } from "../models/User";
import { dbConnect } from "../db/mongoose";

export type AuthedRequest = Request & {
  user?: { id: string; role: "admin" | "member"; householdId: string };
};

export async function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = (req as any).cookies?.[env.JWT_COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    await dbConnect();
    const user = await UserModel.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    req.user = { id: String(user._id), role: user.role, householdId: user.householdId };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function adminRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  return next();
}
