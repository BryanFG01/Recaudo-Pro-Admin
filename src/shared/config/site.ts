// Sitio público (RecaudoProWebStatic): páginas legales enlazadas desde el login
export const PUBLIC_SITE_URL = 'https://recaudopro.cloud'

export const LEGAL_LINKS = {
  privacy: `${PUBLIC_SITE_URL}/privacidad/`,
  terms:   `${PUBLIC_SITE_URL}/terminos/`,
} as const
