import { useAuthStore } from '@/features/auth/presentation/store/authStore'

/**
 * Cliente HTTP del panel. Todas las llamadas van a /api/... del propio Next: el proxy
 * (src/shared/utils/apiProxy.ts) adjunta el token de la cookie httpOnly y renueva la sesión.
 * El navegador nunca maneja tokens.
 */

/** Error con código HTTP para que repositorios y páginas distingan 404, 403, etc. */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

export const SESSION_EXPIRED_PARAM = 'sesion'

/** 401 después de que el proxy intentó renovar: la sesión terminó (vencida, revocada o cerrada). */
function handleSessionEnded(): void {
  useAuthStore.getState().signOut()
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    window.location.assign(`/login?${SESSION_EXPIRED_PARAM}=expirada`)
  }
}

async function errorMessage(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null
  const message = body?.message ?? body?.error
  if (Array.isArray(message)) return message.join('. ')
  return typeof message === 'string' && message ? message : `Error ${response.status}: ${response.statusText}`
}

async function request<T>(method: string, endpoint: string, body?: BodyInit, json = true): Promise<T> {
  const response = await fetch(endpoint, {
    method,
    headers: json ? { 'Content-Type': 'application/json' } : undefined,
    body
  })
  if (response.status === 401) handleSessionEnded()
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status)
  if (response.status === 204) return undefined as T

  const text = await response.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiError('La respuesta del servidor no es válida.', response.status)
  }
}

const toJson = (data: unknown) => (data === undefined ? undefined : JSON.stringify(data))

export const apiClient = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, data?: unknown) => request<T>('POST', endpoint, toJson(data)),
  put: <T>(endpoint: string, data?: unknown) => request<T>('PUT', endpoint, toJson(data)),
  patch: <T>(endpoint: string, data?: unknown) => request<T>('PATCH', endpoint, toJson(data)),
  delete: <T>(endpoint: string) => request<T>('DELETE', endpoint),

  /**
   * Sube una imagen (PNG o JPG, máximo 5 MB) a POST /api/upload/image y devuelve su URL pública.
   * El navegador arma el multipart/form-data con su boundary (no se fija Content-Type).
   */
  async uploadImage(file: File): Promise<string> {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      throw new Error('Solo se permiten imágenes PNG o JPG.')
    }
    if (file.size > 5 * 1024 * 1024) throw new Error('La imagen no debe superar 5 MB.')

    const form = new FormData()
    form.append('file', file)
    const data = await request<{ url?: string }>('POST', '/api/upload/image', form, false)
    if (!data?.url) throw new Error('La respuesta del servidor no incluyó la URL de la imagen.')
    return data.url
  }
}
