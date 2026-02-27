import mongoose from "mongoose";

const DutySchema = new mongoose.Schema(
  {
    householdId: { type: String, required: true, index: true },
    key: { type: String, required: true },
    label: { type: String, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

DutySchema.index({ householdId: 1, key: 1 }, { unique: true });

export const DutyModel = mongoose.models.Duty || mongoose.model("Duty", DutySchema);
