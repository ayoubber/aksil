import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--color-bg)',
        overflow: 'hidden',
        fontFamily: 'var(--font-body)'
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        {/* Subtle top border gradient */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(232,168,48,0.12), transparent)',
            zIndex: 10,
            marginBottom: -1
          }}
        />
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
