import mongoose from "mongoose";
import { HOUSEHOLD_ID } from "../config";

const HouseholdSchema = new mongoose.Schema(
  {
    _id: { type: String, default: HOUSEHOLD_ID },
    name: { type: String, required: true },
    timezone: { type: String, required: true },
    maxUsers: { type: Number, required: true }
  },
  { timestamps: true }
);

export const HouseholdModel =
  mongoose.models.Household || mongoose.model("Household", HouseholdSchema);
