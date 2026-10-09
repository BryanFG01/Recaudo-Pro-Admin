import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useAuth } from './useAuth'

/** Espera máxima a que zustand restaure los datos guardados antes de continuar igual. */
const HYDRATION_TIMEOUT_MS = 5000

/**
 * Sesión de las pantallas del panel. El middleware ya garantiza la cookie de sesión; aquí se
 * espera a que se restauren los datos del administrador. Si hay cookie pero no datos locales
 * (ej. se borró el almacenamiento del navegador), se cierra la sesión para volver a entrar
 * con datos completos y evitar un bucle panel ↔ login.
 */
export function useAdminSession() {
  const { user } = useAuthStore()
  const { signOut } = useAuth()
  const router = useRouter()
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated())

  useEffect(() => {
    if (hydrated) return
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
    const timer = setTimeout(() => setHydrated(true), HYDRATION_TIMEOUT_MS)
    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [hydrated])

  useEffect(() => {
    if (hydrated && !user) void signOut().finally(() => router.replace('/login'))
  }, [hydrated, user, signOut, router])

  return { isReady: hydrated && user !== null }
}
