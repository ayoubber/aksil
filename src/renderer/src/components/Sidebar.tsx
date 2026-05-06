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
} from 'lucide-react'

// 1. هنا درنا استيراد (import) للشعار نتاعك
import logoImg from '../assets/logo.png'

const navGroups = [
  {
    label: 'Aperçu',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' }
    ]
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/products', icon: Package, label: 'Produits' },
      { to: '/inventory', icon: Warehouse, label: 'Inventaire' },
    ]
  },
  {
    label: 'Commerce',
    items: [
      { to: '/sales', icon: ShoppingCart, label: 'Ventes' },
      { to: '/customers', icon: Users, label: 'Clients' },
      { to: '/invoices', icon: FileText, label: 'Factures' },
    ]
  },
  {
    label: 'Analyse',
    items: [
      { to: '/reports', icon: BarChart3, label: 'Rapports' },
    ]
  }
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A'

  return (
    <aside
      className="flex flex-col h-screen bg-surface border-r overflow-hidden shrink-0"
      style={{
        width: 248,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── BRAND ── */}
      <div
        style={{
          padding: '22px 20px 20px',
          borderBottom: '1px solid var(--color-border)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background hex pattern */}
        <div style={{
          position: 'absolute',
          top: -20,
          right: -20,
          opacity: 0.4,
          pointerEvents: 'none',
        }}>
          <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
            {[
              [60, 20], [88, 36], [88, 68], [60, 84], [32, 68], [32, 36]
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill="rgba(232,168,48,0.25)" />
            ))}
            <path d="M60 20L88 36V68L60 84L32 68V36Z"
              stroke="rgba(232,168,48,0.08)" strokeWidth="1" fill="none" />
          </svg>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          {/* 2. هنا عوضنا HexMark بـ الصورة نتاعك */}
          <img 
            src={logoImg} 
            alt="Aksil Logo" 
            style={{ 
              width: 34, 
              height: 34, 
              objectFit: 'contain' // هادي باش تحافظ على أبعاد الصورة وماتتعوجش
            }} 
          />
          
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: '-0.03em',
              color: 'var(--color-text)',
              fontStyle: 'italic',
              lineHeight: 1,
            }}>
              Aksil
            </div>
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginTop: 3,
            }}>
              Gestion de Miel
            </div>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
        {navGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            {/* Group label */}
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              padding: '10px 10px 5px',
            }}>
              {group.label}
            </div>

            {/* Nav items */}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 10,
                  marginBottom: 2,
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-gold-400)' : 'var(--color-text-muted)',
                  background: isActive ? 'rgba(232,168,48,0.07)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(232,168,48,0.15)' : 'transparent'}`,
                  textDecoration: 'none',
                  transition: 'all 0.12s ease',
                  position: 'relative',
                  cursor: 'pointer',
                })}
              >
                {({ isActive }) => (
                  <>
                    {/* Left accent bar */}
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        left: -12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: 18,
                        background: 'linear-gradient(180deg, #F0C050, #E8A830)',
                        borderRadius: '0 3px 3px 0',
                        boxShadow: '2px 0 8px rgba(232,168,48,0.40)',
                      }} />
                    )}
                    <item.icon
                      size={16}
                      strokeWidth={isActive ? 2 : 1.6}
                      style={{ color: isActive ? 'var(--color-gold-500)' : 'var(--color-text-muted)', flexShrink: 0 }}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── BOTTOM: Settings + User ── */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        padding: '12px',
      }}>
        {/* Settings link */}
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 10,
            marginBottom: 10,
            fontSize: 13.5,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--color-gold-400)' : 'var(--color-text-muted)',
            background: isActive ? 'rgba(232,168,48,0.07)' : 'transparent',
            border: `1px solid ${isActive ? 'rgba(232,168,48,0.15)' : 'transparent'}`,
            textDecoration: 'none',
            transition: 'all 0.12s ease',
          })}
        >
          {({ isActive }) => (
            <>
              <Settings size={16} strokeWidth={isActive ? 2 : 1.6}
                style={{ color: isActive ? 'var(--color-gold-500)' : 'var(--color-text-muted)' }} />
              <span>Paramètres</span>
            </>
          )}
        </NavLink>

        {/* User card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px',
          borderRadius: 12,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
        }}>
          {/* Avatar */}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: 'linear-gradient(135deg, rgba(232,168,48,0.20), rgba(232,168,48,0.08))',
            border: '1px solid rgba(232,168,48,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--color-gold-400)',
            flexShrink: 0,
            letterSpacing: '0.02em',
          }}>
            {initials}
          </div>

          {/* Name & role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--color-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.fullName || 'Administrateur'}
            </div>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginTop: 1,
            }}>
              {user?.role || 'Admin'}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              padding: '6px',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.12s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            title="Déconnexion"
          >
            <LogOut size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  )
}