import mongoose, { Schema } from "mongoose";

const EntrySchema = new Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    type: { type: String, enum: ["NOTE", "PHOTO", "CHECKIN"], required: true },
    authorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

EntrySchema.index({ date: 1, createdAt: -1 });

export const Entry = mongoose.models.Entry || mongoose.model("Entry", EntrySchema);