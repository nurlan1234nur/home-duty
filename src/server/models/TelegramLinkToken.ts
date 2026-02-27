import mongoose from "mongoose";

const TelegramLinkTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// TTL index (MongoDB will delete after expiresAt)
TelegramLinkTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TelegramLinkTokenModel =
  mongoose.models.TelegramLinkToken ||
  mongoose.model("TelegramLinkToken", TelegramLinkTokenSchema);
