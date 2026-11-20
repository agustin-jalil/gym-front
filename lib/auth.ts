/** Acceso protegido por un secreto compartido (variable `APP_SECRET`). Solo Web Crypto: corre en el proxy y en route handlers. */

export const AUTH_COOKIE = 'gym_auth'

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

/** Valor de la cookie: el hash del secreto, para no guardar el secreto en el navegador. */
export async function tokenFor(secret: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`gym-front:${secret}`)))
}

/** Comparación sin cortar en la primera diferencia (se comparan los hashes, que tienen largo fijo). */
async function sameHash(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([tokenFor(a), tokenFor(b)])
  let diff = 0
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i)
  return diff === 0
}

export async function secretMatches(given: string, secret: string): Promise<boolean> {
  if (given === '') return false
  return sameHash(given, secret)
}

export type Access = 'ok' | 'denied' | 'not-configured'

export async function checkAccess(input: {
  secret: string | undefined
  production: boolean
  cookie?: string
  authorization?: string
}): Promise<Access> {
  if (!input.secret) return input.production ? 'not-configured' : 'ok'
  const expected = await tokenFor(input.secret)
  if (input.cookie !== undefined && input.cookie.length === expected.length) {
    let diff = 0
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ input.cookie.charCodeAt(i)
    if (diff === 0) return 'ok'
  }
  const bearer = /^Bearer (.+)$/.exec(input.authorization ?? '')
  if (bearer?.[1] && (await secretMatches(bearer[1], input.secret))) return 'ok'
  return 'denied'
}

/** Destino tras iniciar sesión: solo rutas internas (evita redirecciones a otros sitios). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/'
  if (next === '/acceso' || next.startsWith('/acceso?') || next.startsWith('/acceso/')) return '/'
  return next
}
