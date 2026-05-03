import { useEffect, useState } from 'react'
import { Plus, ShoppingCart, Trash2, Eye } from 'lucide-react'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

interface Product {
  id: number
  name: string
  type: string
  sellPrice: number
  wholesale: number | null
  unit: string
  currentStock: number
}
interface Customer {
  id: number
  name: string
  type: string
}
interface Sale {
  id: number
  customerId: number | null
  type: string
  total: number
  discount: number
  paid: number
  status: string
  createdAt: string
  notes: string | null
  customer: { name: string } | null
  items: Array<{ product: { name: string }; quantity: number; unitPrice: number; total: number }>
}

interface CartItem {
  productId: number
  name: string
  quantity: number
  unitPrice: number
  unit: string
  maxStock: number
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModal, setDetailModal] = useState<Sale | null>(null)
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>('retail')
  const [customerId, setCustomerId] = useState('')
  const [discount, setDiscount] = useState('0')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [qty, setQty] = useState('1')
  const { showToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [salesRes, prodRes, custRes] = await Promise.all([
      window.api.getSales(),
      window.api.getProducts(),
      window.api.getCustomers()
    ])
    if (salesRes.success) {
      setSales(salesRes.data as Sale[])
    }
    if (prodRes.success) {
      setProducts((prodRes.data as Product[]).filter((p: any) => p.isActive))
    }
    if (custRes.success) {
      setCustomers(custRes.data as Customer[])
    }
  }

  const addToCart = () => {
    const product = products.find((p) => p.id === parseInt(selectedProduct))
    if (!product) return
    const quantity = parseFloat(qty)
    if (quantity <= 0) return
    const price =
      saleType === 'wholesale' && product.wholesale ? product.wholesale : product.sellPrice

    const existing = cart.find((c) => c.productId === product.id)
    if (existing) {
      setCart(
        cart.map((c) =>
          c.productId === product.id
            ? { ...c, quantity: c.quantity + quantity, unitPrice: price }
            : c
        )
      )
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          quantity,
          unitPrice: price,
          unit: product.unit,
          maxStock: product.currentStock
        }
      ])
    }
    setSelectedProduct('')
    setQty('1')
  }

  const removeFromCart = (productId: number) =>
    setCart(cart.filter((c) => c.productId !== productId))

  const cartTotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0)
  const finalTotal = cartTotal - parseFloat(discount || '0')

  const handleSubmit = async () => {
    if (cart.length === 0) {
      showToast('Ajoutez des produits', 'warning')
      return
    }
    const res = await window.api.createSale({
      customerId: customerId ? parseInt(customerId) : undefined,
      type: saleType,
      discount: parseFloat(discount || '0'),
      items: cart.map((c) => ({
        productId: c.productId,
        quantity: c.quantity,
        unitPrice: c.unitPrice
      }))
    })
    if (res.success) {
      showToast('Vente enregistrée', 'success')
      setModalOpen(false)
      setCart([])
      loadData()
    } else {
      showToast(res.error || 'Erreur', 'error')
    }
  }

  const formatPrice = (n: number) => new Intl.NumberFormat('fr-DZ').format(n) + ' DA'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-text">Ventes</h1>
          <p className="text-[14px] font-medium text-text-secondary tracking-wide mt-1">{sales.length} ventes enregistrées</p>
        </div>
        <button
          onClick={() => {
            setCart([])
            setDiscount('0')
            setCustomerId('')
            setSaleType('retail')
            setModalOpen(true)
          }}
          className="btn btn-gold"
        >
          <Plus size={16} /> Nouvelle Vente
        </button>
      </div>

      {/* Sales Table */}
      <div className="card overflow-hidden shadow-sm p-0">
        <div className="table-container border-none bg-transparent rounded-none">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Type</th>
                <th>Articles</th>
                <th className="text-right">Remise</th>
                <th className="text-right">Total</th>
                <th className="text-right">Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="text-text-muted text-[13px] font-medium uppercase tracking-wider">#{s.id}</td>
                  <td className="font-semibold text-text">{s.customer?.name || '—'}</td>
                  <td>
                    <span
                      className={`badge ${s.type === 'wholesale' ? 'badge-gold' : 'badge-info'}`}
                    >
                      {s.type === 'wholesale' ? 'Gros' : 'Détail'}
                    </span>
                  </td>
                  <td className="text-text-secondary text-[13px] font-medium">{s.items.length} article(s)</td>
                  <td className="text-text-muted text-right text-[13px]">
                    {s.discount > 0 ? formatPrice(s.discount) : '—'}
                  </td>
                  <td className="font-bold text-text text-[15px] text-right">{formatPrice(s.total)}</td>
                  <td className="text-text-secondary text-[13px] text-right">
                    {new Date(s.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </td>
                  <td>
                    <button onClick={() => setDetailModal(s)} className="btn btn-ghost p-1.5 hover:bg-surface-elevated rounded-md">
                      <Eye size={16} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouvelle Vente"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Type de vente</label>
              <select
                className="input"
                value={saleType}
                onChange={(e) => setSaleType(e.target.value as 'retail' | 'wholesale')}
              >
                <option value="retail">Détail</option>
                <option value="wholesale">Gros</option>
              </select>
            </div>
            <div>
              <label className="input-label">Client</label>
              <select
                className="input"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Client de passage</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === 'wholesale' ? 'Gros' : 'Détail'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add product to cart */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="input-label">Produit</label>
              <select
                className="input"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Choisir un produit</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.currentStock} {p.unit} dispo)
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="input-label">Qté</label>
              <input
                type="number"
                className="input"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                min="0.1"
                step="0.1"
              />
            </div>
            <button type="button" onClick={addToCart} className="btn btn-outline">
              Ajouter
            </button>
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-xs">Produit</th>
                    <th className="text-xs">Qté</th>
                    <th className="text-xs">Prix U.</th>
                    <th className="text-xs">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((c) => (
                    <tr key={c.productId}>
                      <td className="text-sm font-medium">{c.name}</td>
                      <td className="text-sm">
                        {c.quantity} {c.unit}
                      </td>
                      <td className="text-sm">{formatPrice(c.unitPrice)}</td>
                      <td className="text-sm font-semibold">
                        {formatPrice(c.unitPrice * c.quantity)}
                      </td>
                      <td>
                        <button
                          onClick={() => removeFromCart(c.productId)}
                          className="btn btn-ghost p-1 text-danger"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Remise (DA)</label>
              <input
                type="number"
                className="input"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                min="0"
              />
            </div>
            <div className="flex flex-col justify-end">
              <p className="text-right text-[14px] font-medium text-text-secondary">
                Sous-total: {formatPrice(cartTotal)}
              </p>
              <p className="text-right text-[22px] font-bold text-gold-500 tracking-tight">
                Total: {formatPrice(finalTotal)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn btn-outline flex-1">
              Annuler
            </button>
            <button onClick={handleSubmit} className="btn btn-gold flex-1">
              <ShoppingCart size={16} /> Enregistrer
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={`Vente #${detailModal?.id}`}
      >
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-text-muted">Client:</span>{' '}
                <span className="font-medium">
                  {detailModal.customer?.name || 'Client de passage'}
                </span>
              </div>
              <div>
                <span className="text-text-muted">Type:</span>{' '}
                <span className="font-medium">
                  {detailModal.type === 'wholesale' ? 'Gros' : 'Détail'}
                </span>
              </div>
              <div>
                <span className="text-text-muted">Date:</span>{' '}
                <span className="font-medium">
                  {new Date(detailModal.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div>
                <span className="text-text-muted">Statut:</span>{' '}
                <span className="badge badge-success">Complétée</span>
              </div>
            </div>
            <div className="border border-border rounded-[14px] overflow-hidden bg-surface-elevated">
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th className="text-right">Qté</th>
                    <th className="text-right">Prix U.</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailModal.items.map((item, i) => (
                    <tr key={i}>
                      <td className="font-semibold text-text">{item.product.name}</td>
                      <td className="text-right font-medium">{item.quantity}</td>
                      <td className="text-right text-text-secondary">{formatPrice(item.unitPrice)}</td>
                      <td className="font-bold text-text text-[14px] text-right">{formatPrice(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {detailModal.discount > 0 && (
              <p className="text-[13px] font-medium text-text-secondary text-right">
                Remise: -{formatPrice(detailModal.discount)}
              </p>
            )}
            <p className="text-right text-[24px] font-bold text-gold-500 tracking-tight">
              Total: {formatPrice(detailModal.total)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
