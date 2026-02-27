import { Router } from "express";
import { authRequired, AuthedRequest } from "../middleware/auth";
import { dbConnect } from "../db/mongoose";
import { UserModel } from "../models/User";

export const meRouter = Router();

meRouter.get("/", authRequired, async (req: AuthedRequest, res) => {
  await dbConnect();
  const user = await UserModel.findById(req.user!.id).lean();
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  return res.json({
    user: { id: String(user._id), name: user.name, email: user.email, role: user.role }
  });
});
