import { getPool } from "@/lib/server/db";
import { dbErrorResponse, errorResponse, readJson } from "@/lib/server/http";
import { createRoutine, listRoutines } from "@/lib/server/routines";
import { parseNewRoutine } from "@/lib/validation";

export async function GET() {
  try {
    return Response.json(await listRoutines(getPool()));
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body.ok) return body.response;
  const parsed = parseNewRoutine(body.value);
  if (!parsed.ok) return errorResponse(400, parsed.error);
  try {
    return Response.json(await createRoutine(getPool(), parsed.value), { status: 201 });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
