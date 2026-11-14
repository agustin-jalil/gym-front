import { getPool } from "@/lib/server/db";
import { deleteExercise, getExercise } from "@/lib/server/exercises";
import { dbErrorResponse, errorResponse } from "@/lib/server/http";
import { isUuid } from "@/lib/validation";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(400, "id inválido");
  try {
    const ex = await getExercise(getPool(), id);
    return ex ? Response.json(ex) : errorResponse(404, "Ejercicio no encontrado");
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(400, "id inválido");
  try {
    const deleted = await deleteExercise(getPool(), id);
    return deleted ? new Response(null, { status: 204 }) : errorResponse(404, "Ejercicio propio no encontrado");
  } catch (err) {
    return dbErrorResponse(err);
  }
}
