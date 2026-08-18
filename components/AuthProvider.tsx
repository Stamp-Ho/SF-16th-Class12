'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  login as requestLogin,
  logout as requestLogout,
  refreshSession,
  type UserInfo,
} from '@/utils/api/client'

type AuthContextValue = {
  user: UserInfo | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    refreshSession()
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  async function login(username: string, password: string) {
    const result = await requestLogin(username, password)
    setUser(result.user)
  }

  async function logout() {
    await requestLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}