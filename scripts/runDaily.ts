import "dotenv/config";
import { dbConnect } from "@/server/db/mongoose";
import { ensureAssignmentsForDate, todayISODateInHouseholdTZ } from "@/server/services/scheduler";

async function main() {
  await dbConnect();
  const d = todayISODateInHouseholdTZ();
  const assignments = await ensureAssignmentsForDate(d);
  console.log(`Ensured assignments for ${d}:`, assignments.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
