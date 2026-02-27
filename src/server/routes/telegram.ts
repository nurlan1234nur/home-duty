import { Router } from "express";
import { dbConnect } from "../db/mongoose";
import { env } from "../config";
import { TelegramLinkTokenModel } from "../models/TelegramLinkToken";
import { UserModel } from "../models/User";
import { getChatIdAndText, parseLinkCommand, sendTelegramMessage } from "../services/telegram";

export const telegramRouter = Router();

telegramRouter.post("/webhook", async (req, res) => {
  // Verify Telegram secret header (if you set secret_token on setWebhook).
  const secret = req.header("X-Telegram-Bot-Api-Secret-Token");
  if (!secret || secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false });
  }

  const parsed = getChatIdAndText(req.body);
  if (!parsed) return res.json({ ok: true });

  const { chatId, text, username } = parsed;
  const code = parseLinkCommand(text);

  if (!code) {
    await sendTelegramMessage(
      chatId,
      "Hi! To link your account: go to Settings → Telegram in the website and generate a code, then send /link CODE here."
    );
    return res.json({ ok: true });
  }

  await dbConnect();
  const token = await TelegramLinkTokenModel.findOne({ code }).lean();
  if (!token) {
    await sendTelegramMessage(chatId, "Invalid or expired code. Generate a new code on the website.");
    return res.json({ ok: true });
  }

  await UserModel.findByIdAndUpdate(token.userId, {
    $set: { "telegram.chatId": chatId, "telegram.username": username }
  });

  await TelegramLinkTokenModel.deleteOne({ code });

  await sendTelegramMessage(chatId, "✅ Linked! You will receive daily duty notifications.");
  return res.json({ ok: true });
});
