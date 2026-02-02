// VITE_BACK_URL es la URL base del backend (ej: https://recaudo-pro-back-production.up.railway.app)
// Fallback a VITE_API_BASE_URL por compatibilidad
const apiBaseUrl = (
  import.meta.env.VITE_BACK_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ''
).replace(/\/$/, '')

if (!apiBaseUrl) {
  console.warn(
    'VITE_BACK_URL (o VITE_API_BASE_URL) no está configurado. Las llamadas al API pueden fallar.\n' +
      'Agrega VITE_BACK_URL a tu archivo .env (ej: VITE_BACK_URL=https://tu-backend.com)'
  )
}

export const apiBase = apiBaseUrl

function buildUrl(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${apiBase}${path}`
}

/** Error con código HTTP para que los repositorios/páginas puedan distinguir 404, etc. */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function getErrorMessage(response: Response): Promise<string> {
  const err = await response.json().catch(() => ({}))
  if (!err || typeof err !== 'object') return `Error ${response.status}: ${response.statusText}`
  const msg = 'message' in err ? String(err.message) : 'error' in err ? String(err.error) : null
  return msg || `Error ${response.status}: ${response.statusText}`
}

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const url = buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    if (!response.ok) {
      const msg = await getErrorMessage(response)
      throw new ApiError(msg, response.status)
    }
    return response.json()
  },

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: { credentials?: RequestCredentials }
  ): Promise<T> {
    const url = buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
      credentials: options?.credentials
    })
    if (!response.ok) {
      const msg = await getErrorMessage(response)
      throw new ApiError(msg, response.status)
    }
    return response.json()
  },

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    })
    if (!response.ok) {
      const msg = await getErrorMessage(response)
      throw new ApiError(msg, response.status)
    }
    return response.json()
  },

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    })
    if (!response.ok) {
      const msg = await getErrorMessage(response)
      throw new Error(msg)
    }
    return response.json()
  },

  async delete<T>(endpoint: string): Promise<T> {
    const url = buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
    if (!response.ok) {
      const msg = await getErrorMessage(response)
      throw new ApiError(msg, response.status)
    }
    if (response.status === 204) return undefined as unknown as T
    return response.json()
  },

  /**
   * Sube una imagen a POST /api/upload/image.
   * - Formatos: solo PNG o JPG.
   * - Tamaño: máximo 5 MB.
   * - Envía FormData con el campo "file". La API devuelve la URL pública
   *   (ej. https://...supabase.co/storage/v1/object/public/uploads/images/xxx.jpg).
   * - Respuesta: { url: string }, { path: string } o string con la URL.
   */
  async uploadImage(file: File): Promise<string> {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowed.includes(file.type)) {
      throw new Error('Solo se permiten imágenes PNG o JPG.')
    }
    const maxBytes = 5 * 1024 * 1024 // 5 MB
    if (file.size > maxBytes) {
      throw new Error('La imagen no debe superar 5 MB.')
    }
    const formData = new FormData()
    formData.append('file', file)
    const url = buildUrl('/api/upload/image')
    const response = await fetch(url, {
      method: 'POST',
      body: formData
      // No Content-Type: el navegador establece multipart/form-data con boundary
    })
    if (!response.ok) {
      const msg = await getErrorMessage(response)
      throw new ApiError(msg, response.status)
    }
    const text = await response.text()
    try {
      const data = JSON.parse(text) as unknown
      if (typeof data === 'string') return data
      if (data && typeof (data as { url?: string }).url === 'string')
        return (data as { url: string }).url
      if (data && typeof (data as { path?: string }).path === 'string')
        return (data as { path: string }).path
    } catch {
      /* no es JSON */
    }
    if (typeof text === 'string' && text.trim().startsWith('http')) return text.trim()
    throw new Error('La respuesta del servidor no incluyó la URL de la imagen.')
  }
}
