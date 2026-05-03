import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

interface StockLevel {
  id: number
  name: string
  type: string
  unit: string
  currentStock: number
  minStock: number
  buyPrice: number
  sellPrice: number
  stockValue: number
  isLowStock: boolean
}

interface Movement {
  id: number
  productId: number
  type: string
  quantity: number
  reason: string | null
  reference: string | null
  createdAt: string
  product: { name: string; type: string }
}

export default function Inventory() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN')
  const { showToast } = useToast()

  const [form, setForm] = useState({ productId: '', quantity: '', reason: '', reference: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [stockRes, movRes] = await Promise.all([
      window.api.getStockLevels(),
      window.api.getMovements()
    ])
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
      productId: parseInt(form.productId),
      type: movementType,
      quantity: parseFloat(form.quantity),
      reason: form.reason || null,
      reference: form.reference || null
    })
    if (res.success) {
      showToast('Mouvement enregistré', 'success')
      setModalOpen(false)
      loadData()
    } else {
      showToast(res.error || 'Erreur', 'error')
    }
  }

  const formatPrice = (n: number) => new Intl.NumberFormat('fr-DZ').format(n) + ' DA'

  const totalValue = stockLevels.reduce((s, p) => s + p.stockValue, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-text">Inventaire</h1>
          <p className="text-[14px] font-medium text-text-secondary tracking-wide mt-1">
            Valeur totale du stock:{' '}
            <span className="text-gold-500 font-bold">{formatPrice(totalValue)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal('IN')} className="btn btn-gold">
            <ArrowDownCircle size={16} /> Entrée
          </button>
          <button onClick={() => openModal('OUT')} className="btn btn-outline">
            <ArrowUpCircle size={16} /> Sortie
          </button>
          <button onClick={() => openModal('ADJUSTMENT')} className="btn btn-ghost">
            <RefreshCw size={16} /> Ajustement
          </button>
        </div>
      </div>

      {/* Stock Grid */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-5">
          {stockLevels.map((s) => (
            <div key={s.id} className={`card p-6 shadow-sm ${s.currentStock <= 0 ? 'border-danger/40 shadow-[0_4px_24px_rgba(224,82,82,0.1)]' : s.isLowStock ? 'border-warning/40 shadow-[0_4px_24px_rgba(212,155,26,0.1)]' : ''}`}>
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-[12px] font-bold text-text-muted uppercase tracking-widest truncate pr-2">{s.name}</h4>
                {s.currentStock <= 0 ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_8px_rgba(224,82,82,0.6)]"></span>
                ) : s.isLowStock ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-warning shadow-[0_0_8px_rgba(212,155,26,0.6)]"></span>
                ) : null}
              </div>
              <p className="text-[36px] font-bold text-text mb-2 tracking-tight leading-none">
                {s.currentStock}{' '}
                <span className="text-[14px] text-text-muted font-medium">{s.unit}</span>
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50 text-[13px]">
                <span className="text-text-muted font-medium uppercase tracking-wider text-[11px]">Min: <span className="text-text">{s.minStock}</span></span>
                <span className="font-bold text-text-secondary">{formatPrice(s.stockValue)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Movements table */}
      <div className="card shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="font-bold text-[18px] text-text">Historique des mouvements</h3>
        </div>
        <div className="table-container border-none bg-transparent rounded-none">
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Type</th>
                <th className="text-right">Quantité</th>
                <th>Raison</th>
                <th>Référence</th>
                <th className="text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {movements.slice(0, 20).map((m) => (
                <tr key={m.id}>
                  <td className="font-semibold text-text">{m.product.name}</td>
                  <td>
                    <span
                      className={`badge ${m.type === 'IN' ? 'badge-success' : m.type === 'OUT' ? 'badge-danger' : 'badge-info'}`}
                    >
                      {m.type === 'IN' ? 'Entrée' : m.type === 'OUT' ? 'Sortie' : 'Ajustement'}
                    </span>
                  </td>
                  <td
                    className={`font-bold text-[15px] text-right ${m.type === 'IN' ? 'text-success' : m.type === 'OUT' ? 'text-danger' : 'text-text'}`}
                  >
                    {m.type === 'IN' ? '+' : m.type === 'OUT' ? '-' : '±'}
                    {m.quantity}
                  </td>
                  <td className="text-text-secondary text-[13px]">{m.reason || '—'}</td>
                  <td className="text-text-muted text-[13px] font-medium tracking-wide uppercase">{m.reference || '—'}</td>
                  <td className="text-text-muted text-[13px] font-medium text-right">
                    {new Date(m.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          movementType === 'IN'
            ? 'Entrée de stock'
            : movementType === 'OUT'
              ? 'Sortie de stock'
              : 'Ajustement de stock'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Produit *</label>
            <select
              className="input"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              required
            >
              <option value="">Sélectionner un produit</option>
              {stockLevels.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (stock: {s.currentStock} {s.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Quantité *</label>
            <input
              type="number"
              className="input"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
              min="0.1"
              step="0.1"
            />
          </div>
          <div>
            <label className="input-label">Raison</label>
            <input
              className="input"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Ex: Réception fournisseur"
            />
          </div>
          <div>
            <label className="input-label">Référence</label>
            <input
              className="input"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Ex: LOT-2026-001"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-outline flex-1"
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-gold flex-1">
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
