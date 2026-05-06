import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

interface StockLevel {
  id: number; name: string; type: string; unit: string
  currentStock: number; minStock: number
  buyPrice: number; sellPrice: number; stockValue: number; isLowStock: boolean
}
interface Movement {
  id: number; productId: number; type: string; quantity: number
  reason: string | null; reference: string | null; createdAt: string
  product: { name: string; type: string }
}

const S = {
  page: { padding: '32px', maxWidth: 1300 } as React.CSSProperties,
  title: { fontFamily: 'var(--font-display)', fontStyle: 'italic' as const, fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text)', marginBottom: 4, lineHeight: 1 } as React.CSSProperties,
  sub: { fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 } as React.CSSProperties,
  label: { display: 'block' as const, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' as const, color: 'var(--color-text-muted)', marginBottom: 7 },
}

export default function Inventory() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN')
  const { showToast } = useToast()
  const [form, setForm] = useState({ productId: '', quantity: '', reason: '', reference: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [stockRes, movRes] = await Promise.all([window.api.getStockLevels(), window.api.getMovements()])
    if (stockRes.success) setStockLevels(stockRes.data as StockLevel[])
    if (movRes.success) setMovements(movRes.data as Movement[])
    setLoading(false)
  }

  const openModal = (type: 'IN' | 'OUT' | 'ADJUSTMENT') => {
    setMovementType(type)
    setForm({ productId: '', quantity: '', reason: '', reference: '' })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await window.api.addMovement({
      productId: parseInt(form.productId), type: movementType,
      quantity: parseFloat(form.quantity),
      reason: form.reason || null, reference: form.reference || null,
    })
    if (res.success) {
      showToast('Mouvement enregistré', 'success')
      setModalOpen(false)
      loadData()
    } else {
      showToast(res.error || 'Erreur', 'error')
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('fr-DZ').format(n) + ' DA'
  const totalValue = stockLevels.reduce((s, p) => s + p.stockValue, 0)
  const lowCount = stockLevels.filter(p => p.isLowStock).length
  const totalUnits = stockLevels.reduce((s, p) => s + p.currentStock, 0)

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={S.title}>Inventaire</h1>
          <p style={S.sub}>Suivi du stock en temps réel</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => openModal('IN')} className="btn btn-gold">
            <ArrowDownCircle size={15} /> Entrée
          </button>
          <button onClick={() => openModal('OUT')} className="btn btn-outline">
            <ArrowUpCircle size={15} /> Sortie
          </button>
          <button onClick={() => openModal('ADJUSTMENT')} className="btn btn-outline">
            <RefreshCw size={14} /> Ajustement
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Valeur Totale du Stock', value: fmt(totalValue), icon: '💰', accent: true },
          { label: 'Unités en Stock', value: `${totalUnits.toFixed(1)} unités`, icon: '📦', accent: false },
          { label: 'Produits en Alerte', value: lowCount.toString(), icon: '⚠️', accent: false, warn: lowCount > 0 },
        ].map((card) => (
          <div key={card.label} className="card" style={{
            padding: '18px 22px',
            border: card.accent ? '1px solid rgba(232,168,48,0.22)' : card.warn && (card.value !== '0') ? '1px solid rgba(232,168,48,0.15)' : '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 10 }}>{card.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26, fontWeight: 800, color: card.accent ? 'var(--color-gold-400)' : 'var(--color-text)', letterSpacing: '-0.02em' }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Stock Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 130 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {stockLevels.map((s) => {
            const pct = Math.min(100, (s.currentStock / Math.max(s.minStock * 2, 1)) * 100)
            const isEmpty = s.currentStock <= 0
            const isLow = s.isLowStock && !isEmpty
            const barColor = isEmpty ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : 'linear-gradient(90deg, #C88818, #F0C050)'
            const dotColor = isEmpty ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : 'var(--color-success)'
            const dotGlow = isEmpty ? 'rgba(224,72,72,0.6)' : isLow ? 'rgba(232,168,48,0.6)' : 'rgba(46,170,112,0.6)'
            return (
              <div key={s.id} className="card" style={{
                padding: '16px 18px',
                border: isEmpty ? '1px solid rgba(224,72,72,0.15)' : isLow ? '1px solid rgba(232,168,48,0.15)' : '1px solid var(--color-border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3, flex: 1, paddingRight: 8 }}>
                    {s.name}
                  </div>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, boxShadow: `0 0 7px ${dotGlow}`, flexShrink: 0, marginTop: 3 }} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 28, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>
                  {s.currentStock}
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontStyle: 'normal', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: 4 }}>{s.unit}</span>
                </div>
                {/* Progress bar */}
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', margin: '10px 0 8px' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)' }}>
                  <span>Min: {s.minStock}</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{fmt(s.stockValue)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Movements History */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Historique des mouvements</div>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>20 derniers</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.20)' }}>
              {['Produit', 'Type', 'Quantité', 'Raison', 'Référence', 'Date'].map((h, i) => (
                <th key={h} style={{ padding: '10px 20px', fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', textAlign: i >= 2 && i <= 2 ? 'right' : 'left', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {movements.slice(0, 20).map((m) => (
              <tr key={m.id}>
                <td style={{ padding: '11px 20px', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>{m.product.name}</td>
                <td style={{ padding: '11px 20px', borderBottom: '1px solid var(--color-border)' }}>
                  <span className={`badge ${m.type === 'IN' ? 'badge-success' : m.type === 'OUT' ? 'badge-danger' : 'badge-info'}`}>
                    {m.type === 'IN' ? '↓ Entrée' : m.type === 'OUT' ? '↑ Sortie' : '↔ Ajust.'}
                  </span>
                </td>
                <td style={{ padding: '11px 20px', fontSize: 14, fontWeight: 700, color: m.type === 'IN' ? 'var(--color-success)' : m.type === 'OUT' ? 'var(--color-danger)' : 'var(--color-text)', textAlign: 'right', borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                  {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : '±'}{m.quantity}
                </td>
                <td style={{ padding: '11px 20px', fontSize: 13, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>{m.reason || '—'}</td>
                <td style={{ padding: '11px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>{m.reference || '—'}</td>
                <td style={{ padding: '11px 20px', fontSize: 12, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  {new Date(m.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={movementType === 'IN' ? 'Entrée de stock' : movementType === 'OUT' ? 'Sortie de stock' : 'Ajustement'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={S.label}>Produit *</label>
            <select className="input" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
              <option value="">Sélectionner un produit</option>
              {stockLevels.map(s => <option key={s.id} value={s.id}>{s.name} — stock: {s.currentStock} {s.unit}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Quantité *</label>
            <input type="number" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required min="0.1" step="0.1" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>Raison</label>
              <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ex: Réception" />
            </div>
            <div>
              <label style={S.label}>Référence</label>
              <input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Ex: LOT-001" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Annuler</button>
            <button type="submit" className="btn btn-gold" style={{ flex: 1 }}>Enregistrer</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}