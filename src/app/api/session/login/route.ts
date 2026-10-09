import { NextRequest, NextResponse } from 'next/server'
import { backendUrl, clientForwardedFor, setSessionCookies } from '@/shared/server/session'

interface LoginBody {
  businessCode?: string
  email?: string
  password?: string
}

interface BackendLogin {
  token: string
  refresh_token: string
  expires_in: number
  superAdmin: { id: string; email: string; business_code: string }
  users: unknown[]
}

/**
 * Login del panel: llama al backend y guarda los tokens en cookies httpOnly.
 * Al navegador solo le devuelve los datos del administrador (nunca los tokens).
 */
export async function POST(req: NextRequest) {
  const { businessCode, email, password } = ((await req.json().catch(() => ({}))) ?? {}) as LoginBody
  const code = businessCode?.trim()
  if (!code) return NextResponse.json({ message: 'Código de negocio requerido', statusCode: 400 }, { status: 400 })

  const forwardedFor = clientForwardedFor(req)
  const response = await fetch(backendUrl(`/api/super-admins/${encodeURIComponent(code)}/users-by-credentials`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}) },
    body: JSON.stringify({ email, password }),
    cache: 'no-store'
  }).catch(() => null)

  if (!response) {
    return NextResponse.json({ message: 'No se pudo conectar con el servidor', statusCode: 504 }, { status: 504 })
  }
  const data = (await response.json().catch(() => null)) as BackendLogin | Record<string, unknown> | null
  if (!response.ok || !data || !('token' in data)) {
    return NextResponse.json(data ?? { message: 'No se pudo iniciar sesión' }, { status: response.ok ? 502 : response.status })
  }

  const login = data as BackendLogin
  const out = NextResponse.json({ super_admin: login.superAdmin, users: login.users })
  setSessionCookies(out, { token: login.token, refresh_token: login.refresh_token, expires_in: login.expires_in })
  return out
}
