import { useEffect, useState } from 'react'
import { Save, Shield, HardDrive, UploadCloud, Image as ImageIcon, Download } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()
  const { user } = useAuth()

  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    const res = await window.api.getSettings()
    if (res.success && res.data) setSettings(res.data)
    setLoading(false)
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await window.api.updateSettings(settings)
    if (res.success) {
      showToast('Paramètres enregistrés', 'success')
    } else {
      showToast(res.error || 'Erreur lors de la sauvegarde', 'error')
    }
    setSaving(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.new !== passwordForm.confirm) {
      showToast('Les nouveaux mots de passe ne correspondent pas', 'error')
      return
    }
    if (passwordForm.new.length < 6) {
      showToast('Le mot de passe doit contenir au moins 6 caractères', 'warning')
      return
    }

    if (!user) return

    const res = await window.api.changePassword(user.id, passwordForm.current, passwordForm.new)
    if (res.success) {
      showToast('Mot de passe mis à jour', 'success')
      setPasswordForm({ current: '', new: '', confirm: '' })
    } else {
      showToast(res.error || 'Erreur', 'error')
    }
  }

  const handleBackup = async () => {
    const res = await window.api.backup()
    if (res.success) showToast(`Sauvegarde réussie : ${res.data?.path}`, 'success')
    else showToast(res.error || 'Erreur de sauvegarde', 'error')
  }

  const handleRestore = async () => {
    if (confirm('Attention : la restauration écrasera les données actuelles. Continuer ?')) {
      const res = await window.api.restore()
      if (res.success) {
        showToast(res.data?.message || 'Restauration réussie', 'success')
        setTimeout(() => window.location.reload(), 2000)
      } else {
        showToast(res.error || 'Erreur de restauration', 'error')
      }
    }
  }

  const handleSelectLogo = async () => {
    const res = await window.api.selectLogo()
    if (res.success && res.data?.path) {
      setSettings({ ...settings, logo_path: res.data.path })
      showToast('Logo mis à jour', 'success')
    }
  }

  if (loading)
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-text-secondary text-sm mt-1">
          Configuration de l'entreprise et de l'application
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Business Info */}
        <form onSubmit={handleSaveSettings} className="card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
            <Shield className="text-gold" size={20} />
            <h2 className="text-lg font-semibold">Informations de l'entreprise</h2>
          </div>

          <div>
            <label className="input-label">Nom de l'entreprise</label>
            <input
              className="input"
              value={settings.business_name || ''}
              onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
            />
          </div>
          <div>
            <label className="input-label">Adresse</label>
            <textarea
              className="input h-20 resize-none"
              value={settings.business_address || ''}
              onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Téléphone</label>
              <input
                className="input"
                value={settings.business_phone || ''}
                onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input"
                value={settings.business_email || ''}
                onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Devise</label>
              <input
                className="input"
                value={settings.currency || 'DZD'}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              />
            </div>
            <div>
              <label className="input-label">TVA par défaut (%)</label>
              <input
                type="number"
                className="input"
                value={settings.tax_rate || '19'}
                onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSelectLogo}
              className="btn btn-outline w-full mb-4"
            >
              <ImageIcon size={16} /> Choisir un logo (Factures)
            </button>
            <button type="submit" disabled={saving} className="btn btn-gold w-full">
              <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {/* Security */}
          <form onSubmit={handlePasswordChange} className="card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <Shield className="text-gold" size={20} />
              <h2 className="text-lg font-semibold">Sécurité</h2>
            </div>
            <div>
              <label className="input-label">Mot de passe actuel</label>
              <input
                type="password"
                className="input"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label">Nouveau mot de passe</label>
              <input
                type="password"
                className="input"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="input-label">Confirmer le mot de passe</label>
              <input
                type="password"
                className="input"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-outline w-full mt-2">
              Mettre à jour le mot de passe
            </button>
          </form>

          {/* Backup/Restore */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <HardDrive className="text-gold" size={20} />
              <h2 className="text-lg font-semibold">Base de données</h2>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Sauvegardez vos données régulièrement pour éviter toute perte en cas de problème
              matériel.
            </p>
            <div className="space-y-3">
              <button onClick={handleBackup} className="btn btn-outline w-full justify-start">
                <Download size={16} className="text-success" /> Sauvegarder les données
              </button>
              <button onClick={handleRestore} className="btn btn-outline w-full justify-start">
                <UploadCloud size={16} className="text-warning" /> Restaurer une sauvegarde
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
