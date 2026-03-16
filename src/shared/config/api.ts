import { useAuthStore } from '@/features/auth/presentation/store/authStore'

const PLACEHOLDER_API_URL = '__VITE_BACK_URL__'

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * URL base del backend. En producción (Docker) puede inyectarse en runtime
 * vía data-api-url en #root (el entrypoint reemplaza __VITE_BACK_URL__ en index.html).
 * Si no, usa las variables de build (VITE_BACK_URL / VITE_API_BASE_URL).
 */
function getApiBaseUrl(): string {
  if (typeof document !== 'undefined') {
    const url = document.getElementById('root')?.getAttribute('data-api-url')
    if (url && url !== PLACEHOLDER_API_URL) return url.replace(/\/$/, '')
  }
  // Use relative path for Next.js proxy route or direct if not
  return '/api';
}

const initialUrl = getApiBaseUrl()
if (!initialUrl) {
  console.warn(
    'VITE_BACK_URL (o VITE_API_BASE_URL) no está configurado. Las llamadas al API pueden fallar.\n' +
      'En producción: definí la variable al construir la imagen (build arg) o al ejecutar el contenedor (env) y usá el entrypoint que inyecta la URL en index.html.'
  )
}

export const apiBase = initialUrl || ''

function buildUrl(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${getApiBaseUrl()}${path.startsWith('/api') ? path.replace('/api', '') : path}`
}

/** Error con código HTTP para que los repositorios/páginas puedan distinguir 404, etc. */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function getErrorMessage(response: Response): Promise<string> {
  const text = await response.text()
  const err = (() => {
    try {
      return JSON.parse(text) as Record<string, unknown>
    } catch {
      return null
    }
  })()
  if (!err || typeof err !== 'object') return `Error ${response.status}: ${response.statusText}`
  const msg = 'message' in err ? String(err.message) : 'error' in err ? String(err.error) : null
  return msg || `Error ${response.status}: ${response.statusText}`
}

/**
 * Parsea el body de la respuesta como JSON. Si el servidor devuelve HTML
 * (p. ej. 404 del frontend o SPA fallback), lanza un error claro en lugar de "Unexpected token '<'".
 */
async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const trimmed = text.trim()
  if (trimmed.toLowerCase().startsWith('<!')) {
    const base = getApiBaseUrl()
    const hint = !base || base === PLACEHOLDER_API_URL
      ? 'En producción: configurá la URL del backend (variable VITE_BACK_URL al construir la imagen o al ejecutar el contenedor; ver README). En local: .env con VITE_BACK_URL.'
      : 'El backend puede no tener esta ruta o está devolviendo una página de error.'
    throw new ApiError(
      `El servidor respondió con HTML en lugar de JSON. ${hint}`,
      response.status
    )
  }
  try {
    return JSON.parse(text) as T
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new ApiError(`Respuesta no válida (no es JSON): ${msg}`, response.status)
  }
}

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const url = buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    if (!response.ok) {
      const msg = await getErrorMessage(response)
      throw new ApiError(msg, response.status)
    }
    return parseJsonResponse<T>(response)
  },

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: { credentials?: RequestCredentials }
  ): Promise<T> {
    const url = buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: data ? JSON.stringify(data) : undefined,
      credentials: options?.credentials
    })
    if (!response.ok) {
      const msg = await getErrorMessage(response)
      throw new ApiError(msg, response.status)
    }
    return parseJsonResponse<T>(response)
  },

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: data ? JSON.stringify(data) : undefined
    })
    if (!response.ok) {
      const msg = await getErrorMessage(response)
      throw new ApiError(msg, response.status)
    }
    return parseJsonResponse<T>(response)
  },

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: data ? JSON.stringify(data) : undefined
    })
    if (!response.ok) {
      const msg = await getErrorMessage(response)
      throw new Error(msg)
    }
    return parseJsonResponse<T>(response)
  },

  async delete<T>(endpoint: string): Promise<T> {
    const url = buildUrl(endpoint)
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
    })
    if (!response.ok) {
      const msg = await getErrorMessage(response)
      throw new ApiError(msg, response.status)
    }
    if (response.status === 204) return undefined as unknown as T
    return parseJsonResponse<T>(response)
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
