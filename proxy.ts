import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE, checkAccess } from '@/lib/auth'

/** Todas las pantallas y la API exigen `APP_SECRET` (cookie de sesión o `Authorization: Bearer`). */
export async function proxy(request: NextRequest) {
  const access = await checkAccess({
    secret: process.env.APP_SECRET,
    production: process.env.NODE_ENV === 'production',
    cookie: request.cookies.get(AUTH_COOKIE)?.value,
    authorization: request.headers.get('authorization') ?? undefined,
  })
  if (access === 'ok') return NextResponse.next()

  const isApi = request.nextUrl.pathname.startsWith('/api/')
  if (access === 'not-configured') {
    const error = 'Falta configurar APP_SECRET en el servidor.'
    return isApi ? NextResponse.json({ error }, { status: 503 }) : new NextResponse(error, { status: 503 })
  }
  if (isApi) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const url = request.nextUrl.clone()
  url.pathname = '/acceso'
  url.search = ''
  url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(url)
}

export const config = {
  // Sin proteger: el login, sus assets y los archivos estáticos que el navegador pide sin cookie.
  matcher: ['/((?!acceso|api/acceso|_next/static|_next/image|icon.svg|manifest.webmanifest).*)'],
}
