import { create } from 'zustand'
import type { AuthPayload } from '../shared-types/index'

interface AuthState {
  token: string | null
  user: AuthPayload | null
  setAuth: (token: string, user: AuthPayload) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  clearAuth: () => set({ token: null, user: null }),
}))
