/**
 * Store de autenticación con Zustand
 */
import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false
  }),

  setLoading: (isLoading) => set({ isLoading }),

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        set({ isLoading: false })
        return { error: error.message }
      }

      set({ 
        user: data.user,
        isAuthenticated: true,
        isLoading: false
      })

      return {}
    } catch {
      set({ isLoading: false })
      return { error: 'Error inesperado durante el inicio de sesión' }
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true })
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error al cerrar sesión:', error)
      }

      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    } catch (err) {
      console.error('Error inesperado al cerrar sesión:', err)
      set({ isLoading: false })
    }
  },

  initialize: async () => {
    try {
      set({ isLoading: true })

      // Obtener la sesión actual
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error al obtener la sesión:', error)
        set({ user: null, isAuthenticated: false, isLoading: false })
        return
      }

      set({ 
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        isLoading: false
      })

      // Escuchar cambios en la autenticación
      supabase.auth.onAuthStateChange((_, session) => {
        set({ 
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
          isLoading: false
        })
      })
    } catch (error) {
      console.error('Error al inicializar autenticación:', error)
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))