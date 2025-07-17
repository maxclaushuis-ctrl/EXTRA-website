import { useState, useEffect } from 'react'
import { Router, Route, Switch } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'

// Components
import LoginPage from '@/pages/LoginPage'
import Dashboard from '@/pages/Dashboard'
import EmployeesPage from '@/pages/EmployeesPage'
import TwvApplicationsPage from '@/pages/TwvApplicationsPage'
import ReportsPage from '@/pages/ReportsPage'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

// Auth context
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

function AppContent() {
  const { user, isAuthenticated, login, logout } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={logout} />
        <main className="flex-1 p-6">
          <Router>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/employees" component={EmployeesPage} />
              <Route path="/twv-applications" component={TwvApplicationsPage} />
              <Route path="/reports" component={ReportsPage} />
              <Route>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900">Pagina niet gevonden</h2>
                  <p className="text-gray-600 mt-2">De pagina die je zoekt bestaat niet.</p>
                </div>
              </Route>
            </Switch>
          </Router>
        </main>
      </div>
      <Toaster />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App