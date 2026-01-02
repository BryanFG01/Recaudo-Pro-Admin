import { create } from 'zustand'
import { User } from '../../domain/models'

interface AuthState {
  user: User | null
  businessId: string | null
  setUser: (user: User | null) => void
  setBusinessId: (businessId: string | null) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  businessId: null,
  setUser: (user) => set({ user }),
  setBusinessId: (businessId) => set({ businessId }),
  signOut: () => set({ user: null, businessId: null }),
}))


