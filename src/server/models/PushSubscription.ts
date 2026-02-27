import mongoose, { Schema } from "mongoose";

const PushSubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    endpoint: { type: String, required: true, unique: true, index: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  },
  { timestamps: true }
);

export const PushSubscriptionModel =
  mongoose.models.PushSubscription || mongoose.model("PushSubscription", PushSubscriptionSchema);
