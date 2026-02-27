import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    householdId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "member"], required: true },
    telegram: {
      chatId: { type: Number },
      username: { type: String }
    }
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
