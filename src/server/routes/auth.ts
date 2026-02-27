import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { dbConnect } from "../db/mongoose";
import { env, HOUSEHOLD_ID, MAX_USERS } from "../config";
import { UserModel } from "../models/User";
import { PasswordResetTokenModel } from "../models/PasswordResetToken";

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

const ForgotSchema = z.object({
  email: z.string().email()
});

const ResetSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8)
});

function canSendEmail() {
  return !!(env.SMTP_USER && env.SMTP_PASS);
}

async function sendResetEmail(to: string, resetUrl: string) {
  if (!canSendEmail()) throw new Error("Email not configured");

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: env.SMTP_SECURE === "true",
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
  });

  const fromName = env.SMTP_FROM_NAME || "HOME";
  const from = `${fromName} <${env.SMTP_USER}>`;

  await transporter.sendMail({
    from,
    to,
    subject: "Password reset",
    text: `Reset your password: ${resetUrl}`,
    html: `<p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
  });
}

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

  const isAdminEmail = body.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
  // First user becomes admin, or force admin by configured email
  const role = isAdminEmail || userCount === 0 ? "admin" : "member";

  const user = await UserModel.create({
    householdId: HOUSEHOLD_ID,
    name: body.name,
    email: body.email.toLowerCase(),
    passwordHash,
    role
  });

  setTokenCookie(res, String(user._id));
  return res.json({
    user: {
      id: String(user._id),
      name: user.name,
      nickname: user.nickname || "",
      email: user.email,
      role: user.role
    }
  });
});

authRouter.post("/login", async (req, res) => {
  const body = LoginSchema.parse(req.body);
  await dbConnect();

  const user = await UserModel.findOne({ email: body.email.toLowerCase() });
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  const isAdminEmail = user.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
  if (isAdminEmail && user.role !== "admin") {
    user.role = "admin";
    await user.save();
  }

  setTokenCookie(res, String(user._id));
  return res.json({
    user: {
      id: String(user._id),
      name: user.name,
      nickname: user.nickname || "",
      email: user.email,
      role: user.role
    }
  });
});

authRouter.post("/forgot", async (req, res) => {
  const body = ForgotSchema.parse(req.body);
  await dbConnect();

  const user = await UserModel.findOne({ email: body.email.toLowerCase() });
  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await PasswordResetTokenModel.create({
      userId: user._id,
      tokenHash,
      expiresAt
    });

    const resetUrl = `${env.APP_BASE_URL}/reset?token=${rawToken}`;
    try {
      await sendResetEmail(user.email, resetUrl);
    } catch {
      // Don't leak config details; respond ok to prevent enumeration
    }
  }

  return res.json({ ok: true });
});

authRouter.post("/reset", async (req, res) => {
  const body = ResetSchema.parse(req.body);
  await dbConnect();

  const tokenHash = crypto.createHash("sha256").update(body.token).digest("hex");
  const tokenDoc = await PasswordResetTokenModel.findOne({ tokenHash });
  if (!tokenDoc) return res.status(400).json({ error: "Invalid or expired token" });
  if (tokenDoc.expiresAt.getTime() < Date.now()) {
    await tokenDoc.deleteOne();
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  const user = await UserModel.findById(tokenDoc.userId);
  if (!user) return res.status(400).json({ error: "Invalid token" });

  user.passwordHash = await bcrypt.hash(body.password, 10);
  await user.save();
  await tokenDoc.deleteOne();

  return res.json({ ok: true });
});

authRouter.post("/logout", async (req, res) => {
  res.clearCookie(env.JWT_COOKIE_NAME, { path: "/" });
  return res.json({ ok: true });
});
