import mongoose from "mongoose";

const RotationSchema = new mongoose.Schema(
  {
    householdId: { type: String, required: true, index: true },
    dutyKey: { type: String, required: true },
    startDate: { type: String, required: true }, // YYYY-MM-DD in household TZ
    userOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }]
  },
  { timestamps: true }
);

RotationSchema.index({ householdId: 1, dutyKey: 1 }, { unique: true });

export const RotationModel =
  mongoose.models.Rotation || mongoose.model("Rotation", RotationSchema);
