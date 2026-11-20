import { getPool } from "@/lib/server/db";
import { dbErrorResponse, errorResponse, readJson } from "@/lib/server/http";
import { deleteMeasurement, getMeasurement, updateMeasurement } from "@/lib/server/measurements";
import { parseMeasurement } from "@/lib/measurements";
import { isUuid } from "@/lib/validation";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(400, "id inválido");
  try {
    const m = await getMeasurement(getPool(), id);
    return m ? Response.json(m) : errorResponse(404, "Medición no encontrada");
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(400, "id inválido");
  const body = await readJson(request);
  if (!body.ok) return body.response;
  const parsed = parseMeasurement(body.value);
  if (!parsed.ok) return errorResponse(400, parsed.error);
  try {
    const m = await updateMeasurement(getPool(), id, parsed.value);
    return m ? Response.json(m) : errorResponse(404, "Medición no encontrada");
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(400, "id inválido");
  try {
    const deleted = await deleteMeasurement(getPool(), id);
    return deleted ? new Response(null, { status: 204 }) : errorResponse(404, "Medición no encontrada");
  } catch (err) {
    return dbErrorResponse(err);
  }
}
