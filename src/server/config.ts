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

  CRON_SECRET: z.string().min(16),

  ADMIN_EMAIL: z.string().email().optional().default("nurlant566@gmail.com"),

  SMTP_HOST: z.string().optional().default("smtp.gmail.com"),
  SMTP_PORT: z.string().optional().default("465"),
  SMTP_SECURE: z.string().optional().default("true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_NAME: z.string().optional().default("HOME"),

  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional().default("mailto:admin@example.com")
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

  CRON_SECRET: process.env.CRON_SECRET,

  ADMIN_EMAIL: process.env.ADMIN_EMAIL,

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,

  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT
});

export const HOUSEHOLD_ID = "default";
export const MAX_USERS = Number(env.HOUSEHOLD_MAX_USERS ?? "5");
