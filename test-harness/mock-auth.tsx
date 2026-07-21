// Mock van @/contexts/AuthContext voor de harness.
import { ReactNode } from 'react';

export function useAuth() {
  return {
    user: { firstName: 'Admin', lastName: 'User' } as any,
    isAuthenticated: true,
    isLoading: false,
    login: async () => ({ success: true }),
    logout: async () => {},
  };
}
export function AuthProvider({ children }: { children: ReactNode }) { return <>{children}</>; }
