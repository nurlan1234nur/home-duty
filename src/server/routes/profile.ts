import { Router } from "express";
import { authRequired, AuthedRequest } from "../middleware/auth";
import { dbConnect } from "../db/mongoose";
import { TelegramLinkTokenModel } from "../models/TelegramLinkToken";
import crypto from "crypto";

export const profileRouter = Router();

function makeCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 chars
}

profileRouter.post("/telegram/link-code", authRequired, async (req: AuthedRequest, res) => {
  await dbConnect();

  const code = makeCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await TelegramLinkTokenModel.create({
    userId: req.user!.id,
    code,
    expiresAt
  });

  return res.json({ code, expiresAt: expiresAt.toISOString() });
});
