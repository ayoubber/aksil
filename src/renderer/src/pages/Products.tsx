import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

interface Product {
  id: number
  name: string
  type: string
  description: string | null
  unit: string
  buyPrice: number
  sellPrice: number
  wholesale: number | null
  minStock: number
  isActive: boolean
  currentStock: number
  createdAt: string
}

const honeyTypes = [
  'Sidr', 'Montagne', 'Eucalyptus', 'Lavande', 'Thym',
  'Fleurs Sauvages', 'Romarin', 'Oranger', 'Acacia', 'Manuka', 'Autre'
]

const S = {
  page: { padding: '32px', maxWidth: 1300 } as React.CSSProperties,
  pageHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 28,
  } as React.CSSProperties,
  title: {
    fontFamily: 'var(--font-display)', fontStyle: 'italic',
    fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em',
    color: 'var(--color-text)', marginBottom: 4, lineHeight: 1,
  } as React.CSSProperties,
  sub: { fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 } as React.CSSProperties,
  label: {
    display: 'block', fontSize: 10.5, fontWeight: 700,
    letterSpacing: '0.10em', textTransform: 'uppercase' as const,
    color: 'var(--color-text-muted)', marginBottom: 7,
  },
  row: { display: 'flex', gap: 12, paddingTop: 6 } as React.CSSProperties,
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const { showToast } = useToast()

  const [form, setForm] = useState({
    name: '', type: 'Sidr', description: '', unit: 'kg',
    buyPrice: '', sellPrice: '', wholesale: '', minStock: '10',
  })

  useEffect(() => { loadProducts() }, [])

  const loadProducts = async () => {
    setLoading(true)
    const res = await window.api.getProducts()
    if (res.success) setProducts(res.data as Product[])
    setLoading(false)
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', type: 'Sidr', description: '', unit: 'kg', buyPrice: '', sellPrice: '', wholesale: '', minStock: '10' })
    setModalOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name, type: p.type, description: p.description || '',
      unit: p.unit, buyPrice: p.buyPrice.toString(), sellPrice: p.sellPrice.toString(),
      wholesale: p.wholesale?.toString() || '', minStock: p.minStock.toString(),
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name: form.name, type: form.type,
      description: form.description || null, unit: form.unit,
      buyPrice: parseFloat(form.buyPrice), sellPrice: parseFloat(form.sellPrice),
      wholesale: form.wholesale ? parseFloat(form.wholesale) : null,
      minStock: parseInt(form.minStock),
    }
    const res = editing
      ? await window.api.updateProduct(editing.id, data)
      : await window.api.createProduct(data)
    if (res.success) {
      showToast(editing ? 'Produit mis à jour' : 'Produit créé', 'success')
      setModalOpen(false)
      loadProducts()
    } else {
      showToast(res.error || 'Erreur', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    const res = await window.api.deleteProduct(id)
    if (res.success) {
      showToast('Produit désactivé', 'success')
      loadProducts()
    } else {
      showToast(res.error || 'Erreur', 'error')
    }
  }

  const filtered = products.filter(p =>
    p.isActive && (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase())
    )
  )
  const fmt = (n: number) => new Intl.NumberFormat('fr-DZ').format(n) + ' DA'

  const stockStatus = (p: Product) => {
    if (p.currentStock <= 0) return { color: 'var(--color-danger)', label: 'Épuisé', glow: '0 0 8px rgba(224,72,72,0.5)' }
    if (p.currentStock <= p.minStock) return { color: 'var(--color-warning)', label: 'Faible', glow: '0 0 8px rgba(232,168,48,0.5)' }
    return { color: 'var(--color-success)', label: null, glow: '0 0 8px rgba(46,170,112,0.5)' }
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.title}>Produits</h1>
          <p style={S.sub}>{filtered.length} produits actifs</p>
        </div>
        <button onClick={openCreate} className="btn btn-gold">
          <Plus size={15} /> Nouveau Produit
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 24 }}>
        <Search size={14} style={{
          position: 'absolute', left: 13, top: '50%',
          transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
        }} />
        <input
          className="input"
          style={{ paddingLeft: 38 }}
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 40, marginBottom: 12 }}>🍯</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
            Aucun produit
          </p>
          <p style={S.sub}>Commencez par ajouter un produit</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {filtered.map((p) => {
            const status = stockStatus(p)
            const margin = ((p.sellPrice - p.buyPrice) / p.buyPrice * 100).toFixed(0)
            return (
              <div
                key={p.id}
                className="card"
                style={{ padding: '20px 22px', cursor: 'default' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = 'rgba(232,168,48,0.18)'
                  el.style.transform = 'translateY(-1px)'
                  el.querySelector<HTMLElement>('.prod-actions')!.style.opacity = '1'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = 'var(--color-border)'
                  el.style.transform = 'translateY(0)'
                  el.querySelector<HTMLElement>('.prod-actions')!.style.opacity = '0'
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 700, color: 'var(--color-text)',
                      marginBottom: 6, lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.name}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 5,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-muted)',
                    }}>
                      {p.type}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="prod-actions" style={{ display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.12s ease', marginLeft: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => openEdit(p)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '5px 7px', borderRadius: 8 }}
                    >
                      <Edit2 size={13} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '5px 7px', borderRadius: 8, color: 'var(--color-text-muted)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {p.description && (
                  <p style={{
                    fontSize: 12.5, color: 'var(--color-text-muted)',
                    lineHeight: 1.5, marginBottom: 14,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {p.description}
                  </p>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--color-border)', margin: '14px 0' }} />

                {/* Price grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>Achat</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                      {fmt(p.buyPrice)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>Vente</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-gold-400)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                      {fmt(p.sellPrice)}
                    </div>
                  </div>
                  {p.wholesale && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>Gros</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                        {fmt(p.wholesale)}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>Stock</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: status.color, boxShadow: status.glow, flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>
                        {p.currentStock} {p.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Margin badge */}
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{
                    fontSize: 10.5, fontWeight: 700,
                    color: 'var(--color-success)',
                    background: 'rgba(46,170,112,0.08)',
                    border: '1px solid rgba(46,170,112,0.12)',
                    padding: '2px 8px', borderRadius: 6,
                  }}>
                    +{margin}% marge
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le produit' : 'Nouveau Produit'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={S.label}>Nom du produit *</label>
            <input className="input" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>Type de miel *</label>
              <select className="input" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {honeyTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Unité</label>
              <select className="input" value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="kg">Kilogramme (kg)</option>
                <option value="pot">Pot</option>
                <option value="bouteille">Bouteille</option>
                <option value="litre">Litre</option>
              </select>
            </div>
          </div>
          <div>
            <label style={S.label}>Description</label>
            <textarea className="input" style={{ height: 72, resize: 'none' }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>Prix d'achat (DA) *</label>
              <input type="number" className="input" value={form.buyPrice}
                onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} required min="0" />
            </div>
            <div>
              <label style={S.label}>Prix de vente (DA) *</label>
              <input type="number" className="input" value={form.sellPrice}
                onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} required min="0" />
            </div>
            <div>
              <label style={S.label}>Prix de gros (DA)</label>
              <input type="number" className="input" value={form.wholesale}
                onChange={(e) => setForm({ ...form, wholesale: e.target.value })} min="0" />
            </div>
          </div>
          <div>
            <label style={S.label}>Stock minimum d'alerte</label>
            <input type="number" className="input" value={form.minStock}
              onChange={(e) => setForm({ ...form, minStock: e.target.value })} min="0" />
          </div>
          <div style={S.row}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Annuler</button>
            <button type="submit" className="btn btn-gold" style={{ flex: 1 }}>{editing ? 'Enregistrer' : 'Créer le produit'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}