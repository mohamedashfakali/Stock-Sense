import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../lib/queries'
import type { User } from '../lib/types'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; name: string }) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const queryClient = useQueryClient()

  const { data: me, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me().then(r => r.data),
    enabled: !!localStorage.getItem('token'),
    retry: false,
  })

  useEffect(() => {
    if (me) {
      setUser(me)
      localStorage.setItem('user', JSON.stringify(me))
    }
  }, [me])

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
    onSuccess: (res) => {
      const { user, token } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Welcome back!')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Login failed'),
  })

  const registerMutation = useMutation({
    mutationFn: (data: { email: string; password: string; name: string }) => authApi.register(data),
    onSuccess: (res) => {
      const { user, token } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Account created!')
    },
    onError: (error: any) => toast.error(error.response?.data?.error || 'Registration failed'),
  })

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    queryClient.clear()
    toast.success('Logged out')
  }

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password })
  }

  const register = async (data: { email: string; password: string; name: string }) => {
    await registerMutation.mutateAsync(data)
  }

  const value: AuthContextType = { user, login, register, logout, isLoading }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}