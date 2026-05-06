import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidth = size === 'sm' ? 440 : size === 'lg' ? 680 : 540

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ padding: '24px' }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth, width: '100%', padding: '28px' }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          paddingBottom: 18,
          borderBottom: '1px solid var(--color-border)',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--color-text)',
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-light)'
              e.currentTarget.style.color = 'var(--color-text)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.color = 'var(--color-text-muted)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}