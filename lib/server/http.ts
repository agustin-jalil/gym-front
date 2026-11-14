import "server-only";

export function errorResponse(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

export async function readJson(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return { ok: false, response: errorResponse(400, "El cuerpo debe ser JSON válido") };
  }
}

/** Traduce errores de Postgres a respuestas claras sin filtrar detalles internos. Lo desconocido es 500. */
export function dbErrorResponse(err: unknown): Response {
  const code = typeof err === "object" && err !== null && "code" in err ? String(err.code) : "";
  switch (code) {
    case "23503":
      return errorResponse(409, "Referencia inválida o elemento en uso");
    case "23505":
      return errorResponse(409, "Ya existe un elemento con esos datos");
    case "23514":
    case "22P02":
    case "22003":
      return errorResponse(400, "Datos inválidos");
    default:
      console.error("Error de base de datos", code || err);
      return errorResponse(500, "Error interno");
  }
}
