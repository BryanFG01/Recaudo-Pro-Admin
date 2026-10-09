import { NextRequest, NextResponse } from 'next/server'
import { backendUrl, clearSessionCookies, readSession } from '@/shared/server/session'

/** Cierra la sesión en el backend (revoca el refresh token) y borra las cookies. */
export async function POST(req: NextRequest) {
  const { refresh } = readSession(req)
  if (refresh) {
    await fetch(backendUrl('/api/auth/logout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: 'no-store'
    }).catch(() => undefined) // si el backend no responde, igual se borran las cookies
  }
  const out = new NextResponse(null, { status: 204 })
  clearSessionCookies(out)
  return out
}
