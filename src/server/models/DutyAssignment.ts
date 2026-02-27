import mongoose from "mongoose";

const DutyAssignmentSchema = new mongoose.Schema(
  {
    householdId: { type: String, required: true, index: true },
    dutyKey: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD in household TZ
    assignedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "done"], default: "pending" },
    doneAt: { type: Date },
    notifiedAt: { type: Date }
  },
  { timestamps: true }
);

DutyAssignmentSchema.index({ householdId: 1, dutyKey: 1, date: 1 }, { unique: true });

export const DutyAssignmentModel =
  mongoose.models.DutyAssignment || mongoose.model("DutyAssignment", DutyAssignmentSchema);
