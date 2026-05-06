import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import backgroundImg from '../assets/background.png'
// 1. استيراد الشعار نتاعك هنا
import logoImg from '../assets/logo.png'

// Honeycomb tessellation background
function HoneycombBg() {
  const size = 28
  const w = size * Math.sqrt(3)
  const h = size * 2
  const cols = 12
  const rows = 8

  const hexPoints = (cx: number, cy: number) => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      return `${cx + size * 0.85 * Math.cos(angle)},${cy + size * 0.85 * Math.sin(angle)}`
    }).join(' ')
  }

  const hexes: { cx: number; cy: number; opacity: number }[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * w + (row % 2 === 0 ? 0 : w / 2)
      const cy = row * h * 0.75
      const dist = Math.sqrt(Math.pow(cx - cols * w * 0.5, 2) + Math.pow(cy - rows * h * 0.375, 2))
      const maxDist = Math.sqrt(Math.pow(cols * w * 0.5, 2) + Math.pow(rows * h * 0.375, 2))
      hexes.push({ cx, cy, opacity: 0.03 + 0.08 * (1 - dist / maxDist) })
    }
  }

  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      viewBox={`0 0 ${cols * w} ${rows * h * 0.75 + h * 0.25}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {hexes.map(({ cx, cy, opacity }, i) => (
        <polygon
          key={i}
          points={hexPoints(cx, cy)}
          fill="none"
          stroke="rgba(232,168,48,1)"
          strokeWidth="0.5"
          opacity={opacity}
        />
      ))}
    </svg>
  )
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs')
      return
    }
    setLoading(true)
    setError('')
    const result = await login(username, password)
    setLoading(false)
    if (result.success) {
      navigate('/')
    } else {
      setError(result.error || 'Identifiants incorrects')
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      height: '100vh',
      background: 'var(--color-bg)',
      fontFamily: 'var(--font-body)',
      overflow: 'hidden',
    }}>

      {/* ── LEFT: FORM PANEL ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        position: 'relative',
        background: 'var(--color-bg)',
        overflow: 'hidden',
      }}>
        {/* Subtle honeycomb bg */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
          <HoneycombBg />
        </div>

        {/* Radial glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(232,168,48,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Form container */}
        <div style={{
          width: '100%',
          maxWidth: 380,
          position: 'relative',
          zIndex: 1,
          animation: 'pageEnter 0.40s cubic-bezier(0.22, 0.61, 0.36, 1) both',
        }}>
          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            {/* Hex logo (عوضناه بالشعار نتاعك) */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              {/* 2. حطينا الصورة هنا */}
              <img 
                src={logoImg} 
                alt="Aksil Logo" 
                style={{ 
                  width: 182, 
                  height: 182, 
                  objectFit: 'contain' 
                }} 
              />
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'linear-gradient(to right, #f8e08e 0%, #d1a054 25%, #b88632 50%, #d1a054 75%, #f8e08e 100%)',
              lineHeight: 1,
              marginBottom: 6,
            }}>
              Aksil
            </h1>
            <p style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--color-text)',
            }}>
              Logiciel de Gestion — Miel
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border-light)',
            borderRadius: 20,
            padding: '32px',
            boxShadow: '0 0 0 1px rgba(232,168,48,0.06), 0 24px 64px rgba(0,0,0,0.50)',
            position: 'relative',
          }}>
            {/* Top shine */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(232,168,48,0.25), transparent)',
              borderRadius: '20px 20px 0 0',
            }} />

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Title */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
                  Connexion
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Entrez vos identifiants pour continuer
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(224,72,72,0.08)',
                  border: '1px solid rgba(224,72,72,0.20)',
                  color: 'var(--color-danger)',
                  fontSize: 13,
                  fontWeight: 500,
                }}>
                  {error}
                </div>
              )}

              {/* Username */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  marginBottom: 7,
                }}>
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 11,
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-gold-500)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(232,168,48,0.10)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border-light)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  marginBottom: 7,
                }}>
                  Mot de passe
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 42px 10px 14px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border-light)',
                      borderRadius: 11,
                      color: 'var(--color-text)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--color-gold-500)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(232,168,48,0.10)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--color-border-light)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      height: '100%',
                      padding: '0 13px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'color 0.12s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                  >
                    {showPassword
                      ? <EyeOff size={16} strokeWidth={2} />
                      : <Eye size={16} strokeWidth={2} />
                    }
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 6,
                  width: '100%',
                  padding: '12px 24px',
                  background: loading
                    ? 'rgba(232,168,48,0.50)'
                    : 'linear-gradient(to right, #f8e08e 0%, #d1a054 25%, #b88632 50%, #d1a054 75%, #f8e08e 100%)',
                  border: 'none',
                  borderRadius: 12,
                  color: '#060407',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13.5,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(232,168,48,0.30)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 6px 22px rgba(232,168,48,0.40)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(232,168,48,0.30)'
                }}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="8" cy="8" r="6" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
                      <path d="M8 2A6 6 0 0 1 14 8" stroke="#060407" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Connexion...
                  </>
                ) : 'Se connecter'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>
              by Aybber &nbsp;·&nbsp; v1.0.0
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: IMAGE PANEL ── */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={backgroundImg}
          alt="Premium Honey"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(6,7,9,0.95) 0%, rgba(6,7,9,0.50) 40%, rgba(6,7,9,0.15) 100%)',
        }} />
        {/* Vignette */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 80% 50%, transparent 40%, rgba(6,7,9,0.40) 100%)',
        }} />

        {/* Quote overlay */}
        <div style={{
          position: 'absolute',
          bottom: 48,
          right: 40,
          left: 60,
          textAlign: 'right',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 22,
            fontWeight: 700,
            color: 'rgba(240,192,80,0.90)',
            lineHeight: 1.4,
            marginBottom: 8,
            letterSpacing: '-0.01em',
          }}>
            "L'or liquide des montagnes de Kabylie"
          </div>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
          }}>
            Aksil Miel — Gestion de stock premium
          </div>
        </div>
      </div>
    </div>
  )
}