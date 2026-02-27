import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { dbConnect } from "../db/mongoose";
import { env, HOUSEHOLD_ID, MAX_USERS } from "../config";
import { UserModel } from "../models/User";

export const authRouter = Router();

const SignupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  inviteCode: z.string().min(1)
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function setTokenCookie(res: any, userId: string) {
  const token = jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: "30d" });
  res.cookie(env.JWT_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

authRouter.post("/signup", async (req, res) => {
  const body = SignupSchema.parse(req.body);

  if (body.inviteCode !== env.HOUSEHOLD_INVITE_CODE) {
    return res.status(403).json({ error: "Invalid invite code" });
  }

  await dbConnect();

  const userCount = await UserModel.countDocuments({ householdId: HOUSEHOLD_ID });
  if (userCount >= MAX_USERS) {
    return res.status(403).json({ error: "Household is full (max 5 users)" });
  }

  const existing = await UserModel.findOne({ email: body.email.toLowerCase() }).lean();
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(body.password, 10);

  // First user becomes admin
  const role = userCount === 0 ? "admin" : "member";

  const user = await UserModel.create({
    householdId: HOUSEHOLD_ID,
    name: body.name,
    email: body.email.toLowerCase(),
    passwordHash,
    role
  });

  setTokenCookie(res, String(user._id));
  return res.json({
    user: { id: String(user._id), name: user.name, email: user.email, role: user.role }
  });
});

authRouter.post("/login", async (req, res) => {
  const body = LoginSchema.parse(req.body);
  await dbConnect();

  const user = await UserModel.findOne({ email: body.email.toLowerCase() });
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  setTokenCookie(res, String(user._id));
  return res.json({ user: { id: String(user._id), name: user.name, email: user.email, role: user.role } });
});

authRouter.post("/logout", async (req, res) => {
  res.clearCookie(env.JWT_COOKIE_NAME, { path: "/" });
  return res.json({ ok: true });
});
