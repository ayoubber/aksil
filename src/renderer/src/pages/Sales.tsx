import { useEffect, useState } from 'react'
import { Plus, ShoppingCart, Eye, X } from 'lucide-react'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

interface Product { id: number; name: string; type: string; sellPrice: number; wholesale: number | null; unit: string; currentStock: number; isActive: boolean }
interface Customer { id: number; name: string; type: string }
interface Sale {
  id: number; customerId: number | null; type: string; total: number; discount: number; paid: number; status: string; createdAt: string; notes: string | null
  customer: { name: string } | null
  items: Array<{ product: { name: string }; quantity: number; unitPrice: number; total: number }>
}
interface CartItem { productId: number; name: string; quantity: number; unitPrice: number; unit: string; maxStock: number }

const S = {
  label: { display: 'block' as const, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' as const, color: 'var(--color-text-muted)', marginBottom: 7 },
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

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [salesRes, prodRes, custRes] = await Promise.all([
      window.api.getSales(), window.api.getProducts(), window.api.getCustomers(),
    ])
    if (salesRes.success) setSales(salesRes.data as Sale[])
    if (prodRes.success) setProducts((prodRes.data as any[]).filter(p => p.isActive))
    if (custRes.success) setCustomers(custRes.data as Customer[])
  }

  const addToCart = () => {
    const product = products.find(p => p.id === parseInt(selectedProduct))
    if (!product) return
    const quantity = parseFloat(qty)
    if (quantity <= 0) return
    const price = saleType === 'wholesale' && product.wholesale ? product.wholesale : product.sellPrice
    const existing = cart.find(c => c.productId === product.id)
    if (existing) {
      setCart(cart.map(c => c.productId === product.id ? { ...c, quantity: c.quantity + quantity, unitPrice: price } : c))
    } else {
      setCart([...cart, { productId: product.id, name: product.name, quantity, unitPrice: price, unit: product.unit, maxStock: product.currentStock }])
    }
    setSelectedProduct(''); setQty('1')
  }

  const removeFromCart = (productId: number) => setCart(cart.filter(c => c.productId !== productId))
  const cartTotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0)
  const finalTotal = cartTotal - parseFloat(discount || '0')

  const handleSubmit = async () => {
    if (cart.length === 0) { showToast('Ajoutez des produits', 'warning'); return }
    const res = await window.api.createSale({
      customerId: customerId ? parseInt(customerId) : undefined,
      type: saleType, discount: parseFloat(discount || '0'),
      items: cart.map(c => ({ productId: c.productId, quantity: c.quantity, unitPrice: c.unitPrice })),
    })
    if (res.success) {
      showToast('Vente enregistrée', 'success')
      setModalOpen(false); setCart([]); loadData()
    } else {
      showToast(res.error || 'Erreur', 'error')
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('fr-DZ').format(n) + ' DA'
  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0)

  return (
    <div style={{ padding: '32px', maxWidth: 1300 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text)', marginBottom: 4, lineHeight: 1 }}>
            Ventes
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {sales.length} ventes · {fmt(totalRevenue)} total
          </p>
        </div>
        <button onClick={() => { setCart([]); setDiscount('0'); setCustomerId(''); setSaleType('retail'); setModalOpen(true) }} className="btn btn-gold">
          <Plus size={15} /> Nouvelle Vente
        </button>
      </div>

      {/* Sales Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.20)' }}>
              {['#', 'Client', 'Type', 'Articles', 'Remise', 'Total', 'Date', ''].map((h, i) => (
                <th key={i} style={{ padding: '11px 18px', fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', textAlign: h === 'Total' || h === 'Remise' ? 'right' : 'left', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(232,168,48,0.025)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', borderBottom: '1px solid var(--color-border)' }}>#{s.id}</td>
                <td style={{ padding: '12px 18px', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>
                  {s.customer?.name || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontWeight: 400 }}>Passage</span>}
                </td>
                <td style={{ padding: '12px 18px', borderBottom: '1px solid var(--color-border)' }}>
                  <span className={`badge ${s.type === 'wholesale' ? 'badge-gold' : 'badge-info'}`}>
                    {s.type === 'wholesale' ? 'Gros' : 'Détail'}
                  </span>
                </td>
                <td style={{ padding: '12px 18px', fontSize: 12.5, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  {s.items.length} article{s.items.length > 1 ? 's' : ''}
                </td>
                <td style={{ padding: '12px 18px', fontSize: 12.5, color: 'var(--color-text-muted)', textAlign: 'right', borderBottom: '1px solid var(--color-border)' }}>
                  {s.discount > 0 ? <span style={{ color: 'var(--color-danger)' }}>-{fmt(s.discount)}</span> : '—'}
                </td>
                <td style={{ padding: '12px 18px', textAlign: 'right', borderBottom: '1px solid var(--color-border)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, fontWeight: 700, color: 'var(--color-gold-400)' }}>
                  {fmt(s.total)}
                </td>
                <td style={{ padding: '12px 18px', fontSize: 12, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                  {new Date(s.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                </td>
                <td style={{ padding: '12px 18px', borderBottom: '1px solid var(--color-border)' }}>
                  <button onClick={() => setDetailModal(s)} className="btn btn-ghost btn-sm" style={{ padding: '5px 8px' }}>
                    <Eye size={14} strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Aucune vente enregistrée</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Sale Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle Vente" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Type & Customer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>Type de vente</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['retail', 'wholesale'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setSaleType(t)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      background: saleType === t ? 'rgba(232,168,48,0.12)' : 'transparent',
                      border: saleType === t ? '1px solid rgba(232,168,48,0.30)' : '1px solid var(--color-border)',
                      color: saleType === t ? 'var(--color-gold-400)' : 'var(--color-text-muted)',
                      transition: 'all 0.12s ease',
                    }}>
                    {t === 'retail' ? 'Détail' : 'Gros'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={S.label}>Client</label>
              <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Client de passage</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Add product */}
          <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: 14, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 10 }}>Ajouter un article</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <select className="input" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                  <option value="">Choisir un produit</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.currentStock} {p.unit} dispo)</option>)}
                </select>
              </div>
              <div style={{ width: 90 }}>
                <input type="number" className="input" value={qty} onChange={(e) => setQty(e.target.value)} min="0.1" step="0.1" placeholder="Qté" />
              </div>
              <button type="button" onClick={addToCart} className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>+ Ajouter</button>
            </div>
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
              {cart.map((c, i) => (
                <div key={c.productId} style={{
                  display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderBottom: i < cart.length - 1 ? '1px solid var(--color-border)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.10)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'right' }}>{c.quantity} {c.unit}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', textAlign: 'right', minWidth: 100 }}>{fmt(c.unitPrice)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gold-400)', fontFamily: 'var(--font-display)', fontStyle: 'italic', minWidth: 90, textAlign: 'right' }}>{fmt(c.unitPrice * c.quantity)}</span>
                    <button onClick={() => removeFromCart(c.productId)} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(224,72,72,0.12)', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={11} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total + Discount */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Remise (DA)</label>
              <input type="number" className="input" value={discount} onChange={(e) => setDiscount(e.target.value)} min="0" />
            </div>
            <div style={{ textAlign: 'right', paddingBottom: 2 }}>
              {parseFloat(discount) > 0 && (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>
                  Sous-total: {fmt(cartTotal)} · Remise: -{fmt(parseFloat(discount))}
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26, fontWeight: 800, color: 'var(--color-gold-400)', letterSpacing: '-0.02em' }}>
                {fmt(finalTotal)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Annuler</button>
            <button onClick={handleSubmit} className="btn btn-gold" style={{ flex: 1 }}>
              <ShoppingCart size={15} /> Enregistrer la vente
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title={`Vente #${detailModal?.id}`}>
        {detailModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['Client', detailModal.customer?.name || 'Client de passage'],
                ['Type', detailModal.type === 'wholesale' ? 'Gros' : 'Détail'],
                ['Date', new Date(detailModal.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })],
                ['Statut', 'Complétée'],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
              {detailModal.items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, padding: '11px 16px', borderBottom: i < detailModal.items.length - 1 ? '1px solid var(--color-border)' : 'none', alignItems: 'center' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>{item.product.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>×{item.quantity}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'right' }}>{fmt(item.unitPrice)}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-gold-400)', fontFamily: 'var(--font-display)', fontStyle: 'italic', minWidth: 90, textAlign: 'right' }}>{fmt(item.total)}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right' }}>
              {detailModal.discount > 0 && <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginBottom: 4 }}>Remise: -{fmt(detailModal.discount)}</div>}
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 28, fontWeight: 800, color: 'var(--color-gold-400)', letterSpacing: '-0.02em' }}>
                {fmt(detailModal.total)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}