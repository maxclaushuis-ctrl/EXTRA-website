import React, { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'hr' | 'viewer'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const queryClient = useQueryClient()

  // Check if user is already logged in
  const { data: currentUser, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Not authenticated')
      }
      return response.json()
    },
    retry: false,
    staleTime: Infinity
  })

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser)
    } else if (error) {
      setUser(null)
    }
  }, [currentUser, error])

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      setUser(data.user)
      queryClient.setQueryData(['auth', 'me'], data.user)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      return response.json()
    },
    onSuccess: () => {
      setUser(null)
      queryClient.clear()
    },
  })

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password })
  }

  const logout = () => {
    logoutMutation.mutate()
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}