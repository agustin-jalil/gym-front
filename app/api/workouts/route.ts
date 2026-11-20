import { getPool } from "@/lib/server/db";
import { dbErrorResponse, errorResponse, readJson } from "@/lib/server/http";
import { createWorkout, listWorkouts } from "@/lib/server/workouts";
import { parseWorkout } from "@/lib/workouts";

export async function GET() {
  try {
    return Response.json(await listWorkouts(getPool()));
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body.ok) return body.response;
  const parsed = parseWorkout(body.value);
  if (!parsed.ok) return errorResponse(400, parsed.error);
  try {
    return Response.json(await createWorkout(getPool(), parsed.value), { status: 201 });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
