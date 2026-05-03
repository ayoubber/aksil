import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react'
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
  'Sidr',
  'Montagne',
  'Eucalyptus',
  'Lavande',
  'Thym',
  'Fleurs Sauvages',
  'Romarin',
  'Oranger',
  'Acacia',
  'Manuka',
  'Autre'
]

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const { showToast } = useToast()

  const [form, setForm] = useState({
    name: '',
    type: 'Sidr',
    description: '',
    unit: 'kg',
    buyPrice: '',
    sellPrice: '',
    wholesale: '',
    minStock: '10'
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    const res = await window.api.getProducts()
    if (res.success) setProducts(res.data as Product[])
    setLoading(false)
  }

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: '',
      type: 'Sidr',
      description: '',
      unit: 'kg',
      buyPrice: '',
      sellPrice: '',
      wholesale: '',
      minStock: '10'
    })
    setModalOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name,
      type: p.type,
      description: p.description || '',
      unit: p.unit,
      buyPrice: p.buyPrice.toString(),
      sellPrice: p.sellPrice.toString(),
      wholesale: p.wholesale?.toString() || '',
      minStock: p.minStock.toString()
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name: form.name,
      type: form.type,
      description: form.description || null,
      unit: form.unit,
      buyPrice: parseFloat(form.buyPrice),
      sellPrice: parseFloat(form.sellPrice),
      wholesale: form.wholesale ? parseFloat(form.wholesale) : null,
      minStock: parseInt(form.minStock)
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

  const filtered = products.filter(
    (p) =>
      p.isActive &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.type.toLowerCase().includes(search.toLowerCase()))
  )

  const formatPrice = (n: number) => new Intl.NumberFormat('fr-DZ').format(n) + ' DA'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-text">Produits</h1>
          <p className="text-[14px] font-medium text-text-secondary tracking-wide mt-1">{filtered.length} produits actifs</p>
        </div>
        <button onClick={openCreate} className="btn btn-gold">
          <Plus size={16} /> Nouveau Produit
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          className="input pl-10"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 skeleton rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state py-16">
          <Package size={48} className="mb-4 text-gold-500 opacity-80" strokeWidth={1} />
          <p className="text-[18px] font-bold text-text mb-2 tracking-tight">Aucun produit</p>
          <p className="text-[14px] font-medium text-text-secondary">Commencez par ajouter un produit</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {filtered.map((p) => (
            <div key={p.id} className="card p-6 group shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-bold text-[18px] text-text tracking-tight">{p.name}</h3>
                  <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-surface border border-border text-text-muted uppercase tracking-widest mt-2">
                    {p.type}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(p)} className="btn btn-ghost p-1.5 hover:bg-surface-elevated rounded-md">
                    <Edit2 size={16} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="btn btn-ghost p-1.5 hover:bg-danger/10 hover:text-danger rounded-md text-text-secondary transition-colors"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
              {p.description && (
                <p className="text-[13px] text-text-muted mb-4 line-clamp-2 leading-relaxed">{p.description}</p>
              )}
              <div className="grid grid-cols-2 gap-5 mt-auto">
                <div>
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-widest block mb-1">Achat</span>
                  <p className="font-bold text-[14px] text-text">{formatPrice(p.buyPrice)}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-widest block mb-1">Vente</span>
                  <p className="font-bold text-[14px] text-gold-500">{formatPrice(p.sellPrice)}</p>
                </div>
                {p.wholesale && (
                  <div>
                    <span className="text-[11px] font-semibold text-text-muted uppercase tracking-widest block mb-1">Gros</span>
                    <p className="font-bold text-[14px] text-text">{formatPrice(p.wholesale)}</p>
                  </div>
                )}
                <div>
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-widest block mb-1">Stock</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${p.currentStock <= 0 ? 'bg-danger shadow-[0_0_8px_rgba(224,82,82,0.6)]' : p.currentStock <= p.minStock ? 'bg-warning shadow-[0_0_8px_rgba(212,155,26,0.6)]' : 'bg-success shadow-[0_0_8px_rgba(46,158,99,0.6)]'}`} />
                    <p className={`font-semibold text-[14px] ${p.currentStock <= p.minStock ? 'text-text' : 'text-text-secondary'}`}>
                      {p.currentStock} {p.unit}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le produit' : 'Nouveau Produit'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Nom du produit *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Type de miel *</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {honeyTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Unité</label>
              <select
                className="input"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                <option value="kg">Kilogramme (kg)</option>
                <option value="pot">Pot</option>
                <option value="bouteille">Bouteille</option>
                <option value="litre">Litre</option>
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea
              className="input h-20 resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">Prix d'achat (DA) *</label>
              <input
                type="number"
                className="input"
                value={form.buyPrice}
                onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
                required
                min="0"
              />
            </div>
            <div>
              <label className="input-label">Prix de vente (DA) *</label>
              <input
                type="number"
                className="input"
                value={form.sellPrice}
                onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
                required
                min="0"
              />
            </div>
            <div>
              <label className="input-label">Prix de gros (DA)</label>
              <input
                type="number"
                className="input"
                value={form.wholesale}
                onChange={(e) => setForm({ ...form, wholesale: e.target.value })}
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="input-label">Stock minimum d'alerte</label>
            <input
              type="number"
              className="input"
              value={form.minStock}
              onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              min="0"
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
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
