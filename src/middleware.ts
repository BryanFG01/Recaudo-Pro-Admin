import { NextRequest, NextResponse } from 'next/server'
import { REFRESH_COOKIE } from '@/shared/server/session'

/**
 * Protección en el servidor, antes de renderizar:
 * - Sin sesión (cookie de refresh), las pantallas del panel redirigen al login.
 * - Con sesión, el login redirige al panel.
 * Así el login solo se muestra cuando de verdad no hay sesión.
 */
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has(REFRESH_COOKIE)
  const isLogin = req.nextUrl.pathname === '/login'

  if (isLogin && hasSession) return NextResponse.redirect(new URL('/admin', req.url))
  if (!isLogin && !hasSession) return NextResponse.redirect(new URL('/login', req.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login']
}
