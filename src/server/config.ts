import { z } from "zod";

const EnvSchema = z.object({
  MONGODB_URI: z.string().min(1),
  HOUSEHOLD_INVITE_CODE: z.string().min(1),
  HOUSEHOLD_NAME: z.string().optional().default("My Household"),
  HOUSEHOLD_TIMEZONE: z.string().optional().default("Asia/Ulaanbaatar"),
  HOUSEHOLD_MAX_USERS: z.string().optional().default("5"),

  JWT_SECRET: z.string().min(16),
  JWT_COOKIE_NAME: z.string().optional().default("token"),

  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(8),

  APP_BASE_URL: z.string().min(1).default("http://localhost:3000"),

  CRON_SECRET: z.string().min(16)
});

export const env = EnvSchema.parse({
  MONGODB_URI: process.env.MONGODB_URI,
  HOUSEHOLD_INVITE_CODE: process.env.HOUSEHOLD_INVITE_CODE,
  HOUSEHOLD_NAME: process.env.HOUSEHOLD_NAME,
  HOUSEHOLD_TIMEZONE: process.env.HOUSEHOLD_TIMEZONE,
  HOUSEHOLD_MAX_USERS: process.env.HOUSEHOLD_MAX_USERS,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_COOKIE_NAME: process.env.JWT_COOKIE_NAME,

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,

  APP_BASE_URL: process.env.APP_BASE_URL,

  CRON_SECRET: process.env.CRON_SECRET
});

export const HOUSEHOLD_ID = "default";
export const MAX_USERS = Number(env.HOUSEHOLD_MAX_USERS ?? "5");
