import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Hexagon
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/products', icon: Package, label: 'Produits' },
  { to: '/inventory', icon: Warehouse, label: 'Inventaire' },
  { to: '/sales', icon: ShoppingCart, label: 'Ventes' },
  { to: '/customers', icon: Users, label: 'Clients' },
  { to: '/invoices', icon: FileText, label: 'Factures' },
  { to: '/reports', icon: BarChart3, label: 'Rapports' },
  { to: '/settings', icon: Settings, label: 'Paramètres' }
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="flex flex-col w-[260px] min-h-screen bg-surface border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
        <div className="bg-surface-elevated border border-border p-2.5 rounded-[14px]">
          <Hexagon size={24} className="text-gold-500" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-text">AKSIL</h1>
          <p className="text-[11px] font-semibold text-text-muted tracking-[0.15em] uppercase">
            Gestion de Miel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'text-gold-500 bg-surface-elevated shadow-sm border border-border'
                  : 'text-text-secondary hover:text-text hover:bg-surface-hover border border-transparent'
              }`
            }
          >
            <item.icon size={18} strokeWidth={1.5} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-sm font-bold text-gold-500">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-text truncate">{user?.fullName || 'Admin'}</p>
            <p className="text-[11px] text-text-muted uppercase tracking-wider">{user?.role || 'admin'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost w-full text-text-secondary hover:text-danger text-sm justify-center"
        >
          <LogOut size={16} strokeWidth={1.5} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
