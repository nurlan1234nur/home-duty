import express from "express";
import cookieParser from "cookie-parser";
import { dbConnect } from "./db/mongoose";
import { notFound, errorHandler } from "./middleware/errors";
import { authRouter } from "./routes/auth";
import { meRouter } from "./routes/me";
import { usersRouter } from "./routes/users";
import { dutiesRouter } from "./routes/duties";
import { rotationsRouter } from "./routes/rotations";
import { todayRouter } from "./routes/today";
import { assignmentsRouter } from "./routes/assignments";
import { profileRouter } from "./routes/profile";
import { telegramRouter } from "./routes/telegram";
import { cronRouter } from "./routes/cron";

let cachedApp: any = null;

export function getExpressApp() {
  if (cachedApp) return cachedApp;

  const app = express();

  app.use(cookieParser());
  app.use(express.json());

  // Ensure DB connection is established (cached) early
  app.use(async (_req, _res, next) => {
    await dbConnect();
    next();
  });

  app.get("/api/v1/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/me", meRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/duties", dutiesRouter);
  app.use("/api/v1/rotations", rotationsRouter);
  app.use("/api/v1/today", todayRouter);
  app.use("/api/v1/assignments", assignmentsRouter);
  app.use("/api/v1/profile", profileRouter);
  app.use("/api/v1/telegram", telegramRouter);
  app.use("/api/v1/cron", cronRouter);

  app.use(notFound);
  app.use(errorHandler);

  cachedApp = app;
  return app;
}
