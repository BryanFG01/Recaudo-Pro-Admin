/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_BACK_URL: string
  /** Override de la ruta de login super-admin si el backend usa otro path (ej: /api/v1/super-admins/users-by-credentials). */
  readonly VITE_API_SUPER_ADMINS_USERS_BY_CREDENTIALS?: string
  /** Ruta o URL completa para subir imágenes (ej: /api/upload/image, /upload/image). Por defecto: /api/upload/image */
  readonly VITE_UPLOAD_IMAGE_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}


