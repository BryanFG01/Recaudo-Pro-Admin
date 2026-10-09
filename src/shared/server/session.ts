import type { NextRequest, NextResponse } from 'next/server'

/**
 * Sesión del panel (solo servidor: route handlers y proxy).
 * Los tokens viven en cookies httpOnly: el JavaScript del navegador nunca los ve,
 * así un XSS no puede robarlos. El proxy los adjunta al backend y renueva la sesión.
 */
export const ACCESS_COOKIE = 'rp_access'
export const REFRESH_COOKIE = 'rp_refresh'

const REFRESH_MAX_AGE_SECONDS = 30 * 24 * 60 * 60
/** Margen para renovar el access token un poco antes de que venza en el backend. */
const ACCESS_EARLY_EXPIRY_SECONDS = 30
/** Ventana en la que peticiones simultáneas comparten la misma renovación. */
const SHARED_REFRESH_MS = 25_000

export interface SessionTokens {
  token: string
  refresh_token: string
  expires_in: number
}

/** URL del backend .NET. En Docker la define docker-compose (BACKEND_URL). */
export function backendUrl(pathAndQuery: string): string {
  const base = process.env.BACKEND_URL ?? process.env.VITE_BACK_URL
  if (!base) throw new Error('BACKEND_URL no está configurada')
  return `${base.replace(/\/$/, '')}${pathAndQuery}`
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge
})

export function setSessionCookies(response: NextResponse, tokens: SessionTokens): void {
  const accessMaxAge = Math.max(tokens.expires_in - ACCESS_EARLY_EXPIRY_SECONDS, ACCESS_EARLY_EXPIRY_SECONDS)
  response.cookies.set(ACCESS_COOKIE, tokens.token, cookieOptions(accessMaxAge))
  response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, cookieOptions(REFRESH_MAX_AGE_SECONDS))
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE, '', cookieOptions(0))
  response.cookies.set(REFRESH_COOKIE, '', cookieOptions(0))
}

export const readSession = (req: NextRequest) => ({
  access: req.cookies.get(ACCESS_COOKIE)?.value,
  refresh: req.cookies.get(REFRESH_COOKIE)?.value
})

/**
 * IP del navegador, para que el backend aplique el rate limit por usuario y no por servidor.
 * Next no expone la IP del socket y reenvía tal cual el X-Forwarded-For que mande el cliente,
 * así que solo es confiable si delante hay un proxy inverso (nginx, Traefik, Caddy) que lo fija:
 * en ese caso se activa TRUST_PROXY=true y se toma la ÚLTIMA IP (la que agregó ese proxy).
 * Sin TRUST_PROXY no se reenvía nada: un atacante no puede inventar IPs para saltarse el límite.
 */
export function clientForwardedFor(req: NextRequest): string | undefined {
  if (process.env.TRUST_PROXY !== 'true') return undefined
  const chain = req.headers.get('x-forwarded-for')?.split(',').map((ip) => ip.trim()).filter(Boolean)
  return chain?.at(-1) ?? req.ip ?? undefined
}

const pendingRefreshes = new Map<string, { promise: Promise<SessionTokens | null>; expiresAt: number }>()

/**
 * Canjea el refresh token. Si varias peticiones del mismo usuario llegan a la vez con el token
 * vencido, todas comparten UNA sola renovación (el backend rota el token en cada uso y
 * reutilizar uno viejo cerraría la sesión).
 */
export function refreshSession(refreshToken: string, forwardedFor?: string): Promise<SessionTokens | null> {
  const now = Date.now()
  pendingRefreshes.forEach((entry, key) => {
    if (entry.expiresAt <= now) pendingRefreshes.delete(key)
  })
  const pending = pendingRefreshes.get(refreshToken)
  if (pending) return pending.promise

  const promise = fetch(backendUrl('/api/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}) },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: 'no-store'
  })
    .then(async (res) => (res.ok ? ((await res.json()) as SessionTokens) : null))
    .catch(() => null)
  pendingRefreshes.set(refreshToken, { promise, expiresAt: now + SHARED_REFRESH_MS })
  return promise
}
