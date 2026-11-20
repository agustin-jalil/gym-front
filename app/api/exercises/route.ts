import { getPool } from "@/lib/server/db";
import { createExercise, listExercises } from "@/lib/server/exercises";
import { dbErrorResponse, errorResponse, readJson } from "@/lib/server/http";
import { parseNewExercise } from "@/lib/validation";

export async function GET() {
  try {
    return Response.json(await listExercises(getPool()));
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body.ok) return body.response;
  const parsed = parseNewExercise(body.value);
  if (!parsed.ok) return errorResponse(400, parsed.error);
  try {
    return Response.json(await createExercise(getPool(), parsed.value), { status: 201 });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
