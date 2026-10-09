import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../../domain/models'

/**
 * Datos del administrador para la interfaz (nombre, negocio, rol). No contiene tokens:
 * la sesión vive en cookies httpOnly y la valida el servidor.
 */
interface AuthState {
  user: User | null
  businessId: string | null
  /** Código de negocio (ej. ARG01) para /api/clients?business_code= */
  businessCode: string | null
  setUser: (user: User | null) => void
  setBusinessId: (businessId: string | null) => void
  setBusinessCode: (code: string | null) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      businessId: null,
      businessCode: null,
      setUser: (user) => set({ user }),
      setBusinessId: (businessId) => set({ businessId }),
      setBusinessCode: (businessCode) => set({ businessCode }),
      signOut: () => set({ user: null, businessId: null, businessCode: null })
    }),
    {
      name: 'recaudo-auth',
      // v2: el token ya no se guarda en el navegador (antes iba en localStorage)
      version: 2,
      migrate: (persisted) => {
        const { user, businessId, businessCode } = (persisted ?? {}) as Partial<AuthState>
        return { user: user ?? null, businessId: businessId ?? null, businessCode: businessCode ?? null } as AuthState
      },
      partialize: (s) => ({ user: s.user, businessId: s.businessId, businessCode: s.businessCode })
    }
  )
)
