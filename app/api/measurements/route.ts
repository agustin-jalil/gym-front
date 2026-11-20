import { getPool } from "@/lib/server/db";
import { dbErrorResponse, errorResponse, readJson } from "@/lib/server/http";
import { createMeasurement, listMeasurements } from "@/lib/server/measurements";
import { parseMeasurement } from "@/lib/measurements";

export async function GET() {
  try {
    return Response.json(await listMeasurements(getPool()));
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body.ok) return body.response;
  const parsed = parseMeasurement(body.value);
  if (!parsed.ok) return errorResponse(400, parsed.error);
  try {
    return Response.json(await createMeasurement(getPool(), parsed.value), { status: 201 });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
