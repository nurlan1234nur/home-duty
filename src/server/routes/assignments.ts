import { Router } from "express";
import { authRequired, AuthedRequest } from "../middleware/auth";
import { dbConnect } from "../db/mongoose";
import { DutyAssignmentModel } from "../models/DutyAssignment";

export const assignmentsRouter = Router();

assignmentsRouter.post("/:id/done", authRequired, async (req: AuthedRequest, res) => {
  await dbConnect();

  const assignment = await DutyAssignmentModel.findById(req.params.id);
  if (!assignment) return res.status(404).json({ error: "Not found" });

  const isAssigned = String(assignment.assignedUserId) === req.user!.id;
  const isAdmin = req.user!.role === "admin";
  if (!isAssigned && !isAdmin) return res.status(403).json({ error: "Forbidden" });

  if (assignment.status !== "done") {
    assignment.status = "done";
    assignment.doneAt = new Date();
    await assignment.save();
  }

  return res.json({ ok: true });
});
