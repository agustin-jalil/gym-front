import { getPool } from "@/lib/server/db";
import { dbErrorResponse, errorResponse } from "@/lib/server/http";
import { deleteWorkout, getWorkout } from "@/lib/server/workouts";
import { isUuid } from "@/lib/validation";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(400, "id inválido");
  try {
    const w = await getWorkout(getPool(), id);
    return w ? Response.json(w) : errorResponse(404, "Entrenamiento no encontrado");
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return errorResponse(400, "id inválido");
  try {
    return (await deleteWorkout(getPool(), id)) ? new Response(null, { status: 204 }) : errorResponse(404, "Entrenamiento no encontrado");
  } catch (err) {
    return dbErrorResponse(err);
  }
}
