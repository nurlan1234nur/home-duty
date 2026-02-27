import "dotenv/config";
import { dbConnect } from "@/server/db/mongoose";
import { env, HOUSEHOLD_ID, MAX_USERS } from "@/server/config";
import { HouseholdModel } from "@/server/models/Household";
import { DutyModel } from "@/server/models/Duty";

async function main() {
  await dbConnect();

  await HouseholdModel.findOneAndUpdate(
    { _id: HOUSEHOLD_ID },
    {
      $setOnInsert: {
        _id: HOUSEHOLD_ID,
        name: env.HOUSEHOLD_NAME,
        timezone: env.HOUSEHOLD_TIMEZONE,
        maxUsers: MAX_USERS
      }
    },
    { upsert: true }
  );

  const duties = [
    { key: "cook", label: "Cook (make food)", active: true },
    { key: "clean", label: "Clean common areas", active: true },
    { key: "trash", label: "Take out trash", active: true }
  ];

  for (const d of duties) {
    await DutyModel.findOneAndUpdate(
      { householdId: HOUSEHOLD_ID, key: d.key },
      { $setOnInsert: { householdId: HOUSEHOLD_ID, ...d } },
      { upsert: true }
    );
  }

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
