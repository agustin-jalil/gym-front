import { AUTH_COOKIE, secretMatches, tokenFor } from "@/lib/auth";
import { errorResponse, readJson } from "@/lib/server/http";

const MAX_AGE = 60 * 60 * 24 * 30;

function cookieHeader(value: string, maxAge: number, request: Request): string {
  const https = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  return `${AUTH_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${https ? "; Secure" : ""}`;
}

export async function POST(request: Request) {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    return process.env.NODE_ENV === "production"
      ? errorResponse(503, "Falta configurar APP_SECRET en el servidor.")
      : Response.json({ ok: true });
  }
  const body = await readJson(request);
  if (!body.ok) return body.response;
  const given = typeof body.value === "object" && body.value !== null && "secret" in body.value ? body.value.secret : undefined;
  if (typeof given !== "string" || !(await secretMatches(given, secret))) return errorResponse(401, "Clave incorrecta");
  return Response.json({ ok: true }, { headers: { "set-cookie": cookieHeader(await tokenFor(secret), MAX_AGE, request) } });
}

/** Cerrar sesión. */
export async function DELETE(request: Request) {
  return Response.json({ ok: true }, { headers: { "set-cookie": cookieHeader("", 0, request) } });
}
