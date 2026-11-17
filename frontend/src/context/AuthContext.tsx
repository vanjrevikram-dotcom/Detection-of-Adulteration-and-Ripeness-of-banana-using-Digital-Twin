import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from '../api/client'

interface User { id: number; name: string; email: string; phone?: string | null; created_at?: string }
interface AuthCtx {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, phone: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  const refresh = async () => {
    if (!localStorage.getItem('token')) { setUser(null); return }
    try {
      const { data } = await api.get('/api/auth/me')
      setUser(data)
    } catch { setUser(null); localStorage.removeItem('token'); setToken(null) }
  }

  useEffect(() => { refresh() }, [])

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
  }
  const register = async (name: string, email: string, phone: string, password: string) => {
    const { data } = await api.post('/api/auth/register', { name, email, phone, password })
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
  }
  const logout = () => { localStorage.removeItem('token'); setToken(null); setUser(null) }

  return <Ctx.Provider value={{ user, token, login, register, logout, refresh }}>{children}</Ctx.Provider>
}

export const useAuth = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside provider')
  return v
}
