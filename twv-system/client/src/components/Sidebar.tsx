import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Medewerkers',
    href: '/employees',
    icon: Users,
  },
  {
    name: 'TWV Aanvragen',
    href: '/twv-applications',
    icon: FileCheck,
  },
  {
    name: 'Rapportages',
    href: '/reports',
    icon: BarChart3,
  },
]

export default function Sidebar() {
  const [location] = useLocation()

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">TWV Manager</h1>
            <p className="text-xs text-gray-500">Tewerkstellingsvergunningen</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </a>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-2">
          TWV Management System v1.0
        </div>
      </div>
    </div>
  )
}