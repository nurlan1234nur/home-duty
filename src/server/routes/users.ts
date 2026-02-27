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
    users: users.map((u) => ({
      id: String(u._id),
      name: u.name,
      nickname: u.nickname || "",
      email: u.email,
      role: u.role
    }))
  });
});

usersRouter.patch("/:id", authRequired, adminRequired, async (req, res) => {
  const userId = String(req.params.id || "");
  const nickname = String(req.body?.nickname || "").trim();

  await dbConnect();
  const user = await UserModel.findOne({ _id: userId, householdId: HOUSEHOLD_ID });
  if (!user) return res.status(404).json({ error: "User not found" });

  user.nickname = nickname ? nickname : undefined;
  await user.save();

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
