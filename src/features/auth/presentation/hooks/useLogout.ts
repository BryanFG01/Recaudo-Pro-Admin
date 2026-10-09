import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from './useAuth'

/** Diálogo de cierre de sesión: revoca la sesión en el backend y vuelve al login. */
export function useLogout() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const confirmLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    setIsDialogOpen(false)
    router.replace('/login')
  }

  return { isDialogOpen, setIsDialogOpen, isLoggingOut, confirmLogout }
}
