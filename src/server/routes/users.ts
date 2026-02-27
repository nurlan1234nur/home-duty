import { Router } from "express";
import { authRequired, adminRequired } from "../middleware/auth";
import { dbConnect } from "../db/mongoose";
import { UserModel } from "../models/User";
import { HOUSEHOLD_ID } from "../config";

export const usersRouter = Router();

usersRouter.get("/", authRequired, adminRequired, async (req, res) => {
  await dbConnect();
  const users = await UserModel.find({ householdId: HOUSEHOLD_ID }).sort({ createdAt: 1 }).lean();
  return res.json({
    users: users.map((u) => ({ id: String(u._id), name: u.name }))
  });
});
