import { getPool } from "@/lib/server/db";
import { dbErrorResponse, errorResponse, readJson } from "@/lib/server/http";
import { deleteRoutine, getRoutine, updateRoutine } from "@/lib/server/routines";
import { isUuid, parseNewRoutine } from "@/lib/validation";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(400, "id inválido");
  try {
    const routine = await getRoutine(getPool(), id);
    return routine ? Response.json(routine) : errorResponse(404, "Rutina no encontrada");
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(400, "id inválido");
  const body = await readJson(request);
  if (!body.ok) return body.response;
  const parsed = parseNewRoutine(body.value);
  if (!parsed.ok) return errorResponse(400, parsed.error);
  try {
    const routine = await updateRoutine(getPool(), id, parsed.value);
    return routine ? Response.json(routine) : errorResponse(404, "Rutina no encontrada");
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(400, "id inválido");
  try {
    const deleted = await deleteRoutine(getPool(), id);
    return deleted ? new Response(null, { status: 204 }) : errorResponse(404, "Rutina no encontrada");
  } catch (err) {
    return dbErrorResponse(err);
  }
}
