import { NextRequest, NextResponse } from 'next/server'
import {
  backendUrl,
  clearSessionCookies,
  clientForwardedFor,
  readSession,
  refreshSession,
  setSessionCookies,
  type SessionTokens
} from '@/shared/server/session'

const TIMEOUT_MS = 15_000

/** Cabeceras del navegador que sí se reenvían al backend (el resto, incluidas las cookies, no). */
const FORWARDED_HEADERS = ['accept', 'accept-language', 'content-type']

const hasBody = (method: string) => !['GET', 'HEAD', 'DELETE', 'OPTIONS'].includes(method)

function forward(req: NextRequest, body: ArrayBuffer | undefined, accessToken: string | undefined) {
  const headers = new Headers()
  FORWARDED_HEADERS.forEach((name) => {
    const value = req.headers.get(name)
    if (value) headers.set(name, value)
  })
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const forwardedFor = clientForwardedFor(req)
  if (forwardedFor) headers.set('X-Forwarded-For', forwardedFor)

  return fetch(backendUrl(`${req.nextUrl.pathname}${req.nextUrl.search}`), {
    method: req.method,
    headers,
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS)
  })
}

function toNextResponse(response: Response): NextResponse {
  const headers = new Headers(response.headers)
  headers.delete('content-encoding')
  headers.delete('content-length')
  const body = response.status === 204 || response.status === 304 ? null : response.body
  return new NextResponse(body, { status: response.status, statusText: response.statusText, headers })
}

/**
 * Proxy del navegador al backend: adjunta el access token de la cookie httpOnly y, si venció
 * (o el backend responde 401), renueva la sesión con el refresh token y reintenta una vez.
 * El cuerpo se reenvía como bytes, así funciona igual con JSON y con multipart (imágenes).
 */
export async function handleProxy(req: NextRequest): Promise<NextResponse> {
  try {
    const body = hasBody(req.method) ? await req.arrayBuffer() : undefined
    const session = readSession(req)
    const forwardedFor = clientForwardedFor(req)

    let renewed: SessionTokens | null = null
    let accessToken = session.access
    if (!accessToken && session.refresh) {
      renewed = await refreshSession(session.refresh, forwardedFor)
      accessToken = renewed?.token
    }

    let response = await forward(req, body, accessToken)
    if (response.status === 401 && session.refresh && !renewed) {
      renewed = await refreshSession(session.refresh, forwardedFor)
      if (renewed) response = await forward(req, body, renewed.token)
    }

    const out = toNextResponse(response)
    if (renewed) setSessionCookies(out, renewed)
    else if (response.status === 401 && session.refresh) clearSessionCookies(out) // la sesión terminó
    return out
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
    console.error(`API proxy ${req.nextUrl.pathname}:`, error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        message: timedOut ? 'El servidor tardó demasiado en responder' : 'No se pudo conectar con el servidor',
        statusCode: 504
      },
      { status: 504 }
    )
  }
}
