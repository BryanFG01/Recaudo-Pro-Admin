import { useEffect, useState } from 'react'
import { SESSION_EXPIRED_PARAM } from '@/shared/config/api'
import { useAuthStore } from '../store/authStore'

/**
 * Pantalla de login: si se muestra es porque no hay sesión (el middleware redirige al panel
 * cuando sí la hay), así que se limpian los datos locales de una sesión anterior. Devuelve el
 * aviso a mostrar cuando se llegó aquí porque la sesión terminó.
 */
export function useSessionNotice(): string | null {
  const clearStore = useAuthStore((s) => s.signOut)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    clearStore()
    if (new URLSearchParams(window.location.search).get(SESSION_EXPIRED_PARAM)) {
      setNotice('Tu sesión terminó. Vuelve a iniciar sesión para continuar.')
    }
  }, [clearStore])

  return notice
}
