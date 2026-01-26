import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../../domain/models'

const INACTIVITY_MS = 12 * 60 * 60 * 1000 // 12 horas

interface AuthState {
  user: User | null
  businessId: string | null
  /** Código de negocio (ej. ARG01) para /api/clients?business_code= */
  businessCode: string | null
  lastActivityAt: number | null
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
      lastActivityAt: null,
      setUser: (user) =>
        set({ user, lastActivityAt: user != null ? Date.now() : null }),
      setBusinessId: (businessId) => set({ businessId }),
      setBusinessCode: (businessCode) => set({ businessCode }),
      signOut: () =>
        set({ user: null, businessId: null, businessCode: null, lastActivityAt: null }),
    }),
    {
      name: 'recaudo-auth',
      partialize: (s) => ({
        user: s.user,
        businessId: s.businessId,
        businessCode: s.businessCode,
        lastActivityAt: s.lastActivityAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (
          state.lastActivityAt != null &&
          Date.now() - state.lastActivityAt > INACTIVITY_MS
        ) {
          useAuthStore.getState().signOut()
        } else if (state.user != null) {
          useAuthStore.setState({ lastActivityAt: Date.now() })
        }
      },
    }
  )
)


