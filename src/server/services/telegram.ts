import { env } from "../config";

export type TelegramUpdate = any;

export async function sendTelegramMessage(chatId: number, text: string) {
  // Telegram requests are HTTPS to: https://api.telegram.org/bot<token>/METHOD
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
  }
  return res.json().catch(() => ({}));
}

export function getChatIdAndText(update: TelegramUpdate): { chatId: number; text: string; username?: string } | null {
  const msg = update?.message ?? update?.edited_message;
  if (!msg?.chat?.id) return null;
  const chatId = msg.chat.id;
  const text = (msg.text ?? "").trim();
  const username = msg?.from?.username;
  return { chatId, text, username };
}

export function parseLinkCommand(text: string): string | null {
  // Accept "/link CODE" or "/link@BotName CODE"
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned.startsWith("/link")) return null;
  const parts = cleaned.split(" ");
  if (parts.length < 2) return null;
  return parts[1].trim();
}
