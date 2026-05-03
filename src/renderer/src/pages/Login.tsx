import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Hexagon, Eye, EyeOff, Loader2 } from 'lucide-react'
import backgroundImg from '../assets/background.png'

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
      setError(result.error || 'Erreur de connexion')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-screen bg-bg text-text font-sans overflow-hidden">
      
      {/* LEFT: FORM PANEL */}
      <div className="flex flex-col justify-center items-center px-16 relative w-full h-full">
        <div className="w-full max-w-[420px] flex flex-col items-center">
          
          {/* 1. LOGO */}
          <div className="bg-surface-elevated border border-border p-3 rounded-2xl mb-6 shadow-lg shadow-black/40">
            <Hexagon size={36} className="text-gold" strokeWidth={1.5} />
          </div>

          {/* 2. TITLE */}
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            AKSIL
          </h1>

          {/* 3. SUBTITLE */}
          <p className="text-[13px] font-medium text-text-secondary tracking-[0.3em] uppercase mb-10 text-center">
            LOGICIEL DE STOCK
          </p>

          {/* 4. FORM (Card Style) */}
          <div className="w-full bg-surface-elevated border border-border rounded-xl p-8 shadow-2xl shadow-black/50">
            <form onSubmit={handleSubmit} className="space-y-6 w-full">
              {error && (
                <div className="p-4 rounded-md bg-danger/10 border border-danger/20 text-danger text-sm font-medium text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2 w-full text-left">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text text-sm focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all placeholder:text-text-muted/50"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2 w-full text-left">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                    Mot de passe
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text text-sm focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all placeholder:text-text-muted/50 pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 h-full px-4 flex items-center justify-center text-text-muted hover:text-text transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 bg-gold hover:bg-gold-light text-[#0B0B0B] font-bold rounded-lg text-[14px] transition-all flex justify-center items-center gap-2 mt-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Se connecter'}
              </button>
            </form>
          </div>

          {/* 5. FOOTER */}
          <div className="mt-12 text-xs text-text-muted font-medium tracking-wide">
            by : Aybber
          </div>

        </div>
      </div>

      {/* RIGHT: IMAGE PANEL */}
      <div className="hidden lg:block relative h-full w-full">
        <img 
          src={backgroundImg} 
          alt="Premium Honey Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.2), rgba(0,0,0,0.9))' }}
        />
      </div>

    </div>
  )
}
