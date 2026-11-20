import { getPool } from "@/lib/server/db";
import { dbErrorResponse, errorResponse, readJson } from "@/lib/server/http";
import { importLegacyState } from "@/lib/server/legacy-import";

/** Importa el contenido de `gym:v1` (localStorage de v0.1). Idempotente: repetirlo no duplica datos. */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body.ok) return body.response;
  try {
    const res = await importLegacyState(getPool(), body.value);
    return res.ok ? Response.json(res.result) : errorResponse(400, res.error);
  } catch (err) {
    return dbErrorResponse(err);
  }
}
