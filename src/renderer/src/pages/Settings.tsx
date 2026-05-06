import { useEffect, useState } from 'react'
import { Save, Shield, HardDrive, Download, UploadCloud, Image as ImageIcon, Building2, Check } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

const S = {
  label: { display: 'block' as const, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' as const, color: 'var(--color-text-muted)', marginBottom: 7 },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid var(--color-border)', marginBottom: 20 } as React.CSSProperties,
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={S.sectionTitle}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(232,168,48,0.10)', border: '1px solid rgba(232,168,48,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold-500)' }}>
          <Icon size={15} strokeWidth={2} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const { showToast } = useToast()
  const { user } = useAuth()
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [savedFeedback, setSavedFeedback] = useState(false)

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    setLoading(true)
    const res = await window.api.getSettings()
    if (res.success && res.data) setSettings(res.data)
    setLoading(false)
  }

  const set = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }))

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await window.api.updateSettings(settings)
    if (res.success) {
      setSavedFeedback(true)
      setTimeout(() => setSavedFeedback(false), 2000)
    } else {
      showToast(res.error || 'Erreur', 'error')
    }
    setSaving(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.next !== passwordForm.confirm) { showToast('Les mots de passe ne correspondent pas', 'error'); return }
    if (passwordForm.next.length < 6) { showToast('Minimum 6 caractères', 'warning'); return }
    if (!user) return
    setPwSaving(true)
    const res = await window.api.changePassword(user.id, passwordForm.current, passwordForm.next)
    if (res.success) {
      showToast('Mot de passe mis à jour', 'success')
      setPasswordForm({ current: '', next: '', confirm: '' })
    } else {
      showToast(res.error || 'Erreur', 'error')
    }
    setPwSaving(false)
  }

  const handleBackup = async () => {
    const res = await window.api.backup()
    if (res.success) showToast('Sauvegarde réussie', 'success')
    else showToast(res.error || 'Erreur', 'error')
  }

  const handleRestore = async () => {
    if (!confirm('La restauration remplacera toutes les données actuelles. Continuer ?')) return
    const res = await window.api.restore()
    if (res.success) {
      showToast('Restauration réussie — Redémarrage...', 'success')
      setTimeout(() => window.location.reload(), 2500)
    } else showToast(res.error || 'Erreur', 'error')
  }

  const handleSelectLogo = async () => {
    const res = await window.api.selectLogo()
    if (res.success && res.data?.path) {
      set('logo_path', res.data.path)
      showToast('Logo mis à jour', 'success')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <div className="skeleton" style={{ height: 36, width: 200, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="skeleton" style={{ height: 440 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="skeleton" style={{ height: 280 }} />
            <div className="skeleton" style={{ height: 180 }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text)', marginBottom: 4, lineHeight: 1 }}>
          Paramètres
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
          Configuration de l'entreprise et de l'application
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── LEFT: Business info ── */}
        <form onSubmit={handleSaveSettings}>
          <Section icon={Building2} title="Informations de l'entreprise">
            <FieldGroup>
              <Field label="Nom de l'entreprise">
                <input className="input" value={settings.business_name || ''} onChange={(e) => set('business_name', e.target.value)} placeholder="Aksil Miel" />
              </Field>
              <Field label="Adresse">
                <textarea className="input" style={{ height: 70, resize: 'none' }} value={settings.business_address || ''} onChange={(e) => set('business_address', e.target.value)} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Téléphone">
                  <input className="input" value={settings.business_phone || ''} onChange={(e) => set('business_phone', e.target.value)} />
                </Field>
                <Field label="Email">
                  <input type="email" className="input" value={settings.business_email || ''} onChange={(e) => set('business_email', e.target.value)} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Devise">
                  <input className="input" value={settings.currency || 'DZD'} onChange={(e) => set('currency', e.target.value)} />
                </Field>
                <Field label="TVA par défaut (%)">
                  <input type="number" className="input" value={settings.tax_rate || '19'} onChange={(e) => set('tax_rate', e.target.value)} />
                </Field>
              </div>
              <Field label="N° Registre fiscal">
                <input className="input" value={settings.business_tax_id || ''} onChange={(e) => set('business_tax_id', e.target.value)} placeholder="Optionnel" />
              </Field>

              {/* Logo selector */}
              <div>
                <label style={S.label}>Logo (pour les factures)</label>
                <button type="button" onClick={handleSelectLogo} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                  <ImageIcon size={14} />
                  {settings.logo_path ? 'Changer le logo' : 'Choisir un logo'}
                </button>
                {settings.logo_path && (
                  <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Check size={11} strokeWidth={2.5} /> Logo configuré
                  </div>
                )}
              </div>

              {/* Save button */}
              <button type="submit" disabled={saving} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                {savedFeedback ? <><Check size={15} strokeWidth={2.5} /> Enregistré</> : saving ? 'Enregistrement...' : <><Save size={14} /> Enregistrer</>}
              </button>
            </FieldGroup>
          </Section>
        </form>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Security */}
          <form onSubmit={handlePasswordChange}>
            <Section icon={Shield} title="Sécurité">
              <FieldGroup>
                {/* Current user info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--color-bg)', borderRadius: 12, border: '1px solid var(--color-border)', marginBottom: 4 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(232,168,48,0.12)', border: '1px solid rgba(232,168,48,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--color-gold-400)' }}>
                    {user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{user?.fullName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>@{user?.username} · {user?.role}</div>
                  </div>
                </div>

                <Field label="Mot de passe actuel">
                  <input type="password" className="input" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} required autoComplete="current-password" />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Nouveau mot de passe">
                    <input type="password" className="input" value={passwordForm.next} onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })} required autoComplete="new-password" />
                  </Field>
                  <Field label="Confirmer">
                    <input type="password" className="input" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} required autoComplete="new-password"
                      style={{ borderColor: passwordForm.confirm && passwordForm.confirm !== passwordForm.next ? 'var(--color-danger)' : '' }} />
                  </Field>
                </div>
                <button type="submit" disabled={pwSaving} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                  <Shield size={14} /> {pwSaving ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </button>
              </FieldGroup>
            </Section>
          </form>

          {/* Backup / Restore */}
          <Section icon={HardDrive} title="Base de données">
            <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--color-bg)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Sauvegardez vos données régulièrement pour éviter toute perte. Les fichiers .db peuvent être restaurés à tout moment.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleBackup} className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Download size={14} style={{ color: 'var(--color-success)' }} />
                <span>Sauvegarder les données</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-muted)' }}>Fichier .db</span>
              </button>
              <button onClick={handleRestore} className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <UploadCloud size={14} style={{ color: 'var(--color-warning)' }} />
                <span>Restaurer une sauvegarde</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-muted)' }}>Écrase les données</span>
              </button>
            </div>
          </Section>

          {/* App info */}
          <div className="card" style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                  Aksil <span style={{ color: 'var(--color-gold-400)' }}>·</span> Logiciel de Gestion
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 4 }}>Version 1.0.0 · SQLite · Electron</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(232,168,48,0.10)', border: '1px solid rgba(232,168,48,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                  <path d="M16 2L28.1244 9V23L16 30L3.87564 23V9L16 2Z" fill="rgba(232,168,48,0.15)" stroke="rgba(232,168,48,0.60)" strokeWidth="1.2" />
                  <circle cx="16" cy="16" r="3.5" fill="#E8A830" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}