import { useEffect, useState, useRef } from 'react'
import { Plus, Printer, Check, FileText, X } from 'lucide-react'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

interface Invoice {
  id: number; number: string; customerId: number; total: number; tax: number
  status: string; dueDate: string | null; createdAt: string; notes: string | null
  customer: { name: string; address: string | null; phone: string | null }
  items: Array<{ product: { name: string }; quantity: number; unitPrice: number; total: number }>
}
interface Customer { id: number; name: string }
interface Product { id: number; name: string; currentStock: number; unit: string; sellPrice: number; wholesale: number | null }

const S = {
  label: { display: 'block' as const, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' as const, color: 'var(--color-text-muted)', marginBottom: 7 },
}

const statusConfig: Record<string, { label: string; badge: string }> = {
  draft: { label: 'Brouillon', badge: 'badge-warning' },
  sent: { label: 'Envoyée', badge: 'badge-info' },
  paid: { label: 'Payée', badge: 'badge-success' },
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [printModal, setPrintModal] = useState<Invoice | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  const [form, setForm] = useState({ customerId: '', tax: '19', notes: '', dueDate: '' })
  const [items, setItems] = useState<Array<{ productId: number; quantity: number; unitPrice: number; name: string }>>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [qty, setQty] = useState('1')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [invRes, custRes, prodRes, setRes] = await Promise.all([
      window.api.getInvoices(), window.api.getCustomers(), window.api.getProducts(), window.api.getSettings(),
    ])
    if (invRes.success) setInvoices(invRes.data as Invoice[])
    if (custRes.success) setCustomers(custRes.data as Customer[])
    if (prodRes.success) setProducts(prodRes.data as Product[])
    if (setRes.success) setSettings(setRes.data as Record<string, string>)
  }

  const addItem = () => {
    const p = products.find(x => x.id === parseInt(selectedProduct))
    if (!p || parseFloat(qty) <= 0) return
    setItems([...items, { productId: p.id, quantity: parseFloat(qty), unitPrice: p.sellPrice, name: p.name }])
    setSelectedProduct(''); setQty('1')
  }

  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))

  const handleCreate = async () => {
    if (!form.customerId || items.length === 0) { showToast('Informations incomplètes', 'warning'); return }
    const res = await window.api.createInvoice({
      customerId: parseInt(form.customerId), tax: parseFloat(form.tax),
      notes: form.notes || undefined, dueDate: form.dueDate || undefined,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
    })
    if (res.success) { showToast('Facture créée', 'success'); setModalOpen(false); loadData() }
    else showToast(res.error || 'Erreur', 'error')
  }

  const updateStatus = async (id: number, status: string) => {
    const res = await window.api.updateInvoiceStatus(id, status)
    if (res.success) loadData()
    else showToast('Erreur', 'error')
  }

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '', 'width=960,height=700')
    if (win) {
      win.document.write(`<html><head><title>Facture ${printModal?.number}</title><style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Helvetica Neue',sans-serif;padding:48px;color:#111;background:#fff;}
        .header{display:flex;justify-content:space-between;margin-bottom:48px;}
        .brand{font-size:28px;font-weight:800;letter-spacing:-0.02em;color:#111;}
        .invoice-label{font-size:36px;font-weight:200;letter-spacing:0.05em;color:#C88818;text-transform:uppercase;}
        .meta{font-size:13px;color:#666;margin-top:4px;line-height:1.7;}
        .bill-to{background:#f8f7f4;padding:20px 24px;border-radius:8px;margin-bottom:36px;}
        .bill-to h3{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#999;margin-bottom:8px;}
        .bill-to p{font-size:16px;font-weight:700;}
        .bill-to span{font-size:13px;color:#666;}
        table{width:100%;border-collapse:collapse;margin-bottom:32px;}
        th{font-size:10px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:#999;padding:10px 0;border-bottom:2px solid #eee;text-align:left;}
        td{padding:14px 0;border-bottom:1px solid #f0f0f0;font-size:14px;}
        td:last-child,th:last-child{text-align:right;}
        .totals{margin-left:auto;width:280px;}
        .totals-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#666;}
        .totals-final{font-size:20px;font-weight:800;color:#111;border-top:2px solid #111;padding-top:12px;margin-top:6px;display:flex;justify-content:space-between;}
        .totals-final span:last-child{color:#C88818;}
        .footer{margin-top:64px;padding-top:24px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center;}
      </style></head><body>${content.innerHTML}</body></html>`)
      win.document.close()
      setTimeout(() => { win.print(); win.close() }, 300)
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('fr-DZ').format(n) + ' DA'
  const itemsSubtotal = (inv: Invoice) => inv.items.reduce((s, i) => s + i.total, 0)

  return (
    <div style={{ padding: '32px', maxWidth: 1300 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--color-text)', marginBottom: 4, lineHeight: 1 }}>Factures</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {invoices.length} factures · {invoices.filter(i => i.status === 'paid').length} payées
          </p>
        </div>
        <button onClick={() => { setForm({ customerId: '', tax: settings.tax_rate || '19', notes: '', dueDate: '' }); setItems([]); setModalOpen(true) }} className="btn btn-gold">
          <Plus size={15} /> Créer une Facture
        </button>
      </div>

      {/* Status summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {['draft', 'sent', 'paid'].map(status => {
          const count = invoices.filter(i => i.status === status).length
          const total = invoices.filter(i => i.status === status).reduce((s, i) => s + i.total, 0)
          const cfg = statusConfig[status]
          return (
            <div key={status} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>{cfg.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: 4 }}>{count}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{fmt(total)}</div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {invoices.length === 0 ? (
          <div className="empty-state"><FileText size={40} style={{ marginBottom: 12, opacity: 0.3 }} /><p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>Aucune facture</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.20)' }}>
                {['Numéro', 'Client', 'Date', 'Échéance', 'Montant TTC', 'Statut', ''].map((h, i) => (
                  <th key={i} style={{ padding: '11px 18px', fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.10em', textAlign: h === 'Montant TTC' ? 'right' : 'left', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(232,168,48,0.025)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '13px 18px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>{inv.number}</td>
                  <td style={{ padding: '13px 18px', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)' }}>{inv.customer?.name}</td>
                  <td style={{ padding: '13px 18px', fontSize: 12.5, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                    {new Date(inv.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '13px 18px', fontSize: 12.5, color: inv.dueDate ? 'var(--color-text-muted)' : 'var(--color-text-disabled)', borderBottom: '1px solid var(--color-border)' }}>
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '13px 18px', textAlign: 'right', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, fontWeight: 700, color: 'var(--color-gold-400)', borderBottom: '1px solid var(--color-border)' }}>
                    {fmt(inv.total)}
                  </td>
                  <td style={{ padding: '13px 18px', borderBottom: '1px solid var(--color-border)' }}>
                    <span className={`badge ${statusConfig[inv.status]?.badge || 'badge-info'}`}>
                      {statusConfig[inv.status]?.label || inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '13px 18px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {inv.status !== 'paid' && (
                        <button onClick={() => updateStatus(inv.id, 'paid')} className="btn btn-ghost btn-sm" style={{ padding: '5px 7px', color: 'var(--color-text-muted)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-success)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                          <Check size={14} strokeWidth={2.5} />
                        </button>
                      )}
                      <button onClick={() => setPrintModal(inv)} className="btn btn-ghost btn-sm" style={{ padding: '5px 7px' }}>
                        <Printer size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle Facture" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / 3' }}>
              <label style={S.label}>Client *</label>
              <select className="input" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                <option value="">Sélectionner</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>TVA (%)</label>
              <input type="number" className="input" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>Date d'échéance</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label style={S.label}>Notes</label>
              <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optionnel" />
            </div>
          </div>
          {/* Add item */}
          <div style={{ background: 'var(--color-bg)', borderRadius: 12, padding: 14, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 10 }}>Ajouter un article</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <select className="input" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                  <option value="">Choisir</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — {new Intl.NumberFormat('fr-DZ').format(p.sellPrice)} DA</option>)}
                </select>
              </div>
              <div style={{ width: 80 }}>
                <input type="number" className="input" value={qty} onChange={(e) => setQty(e.target.value)} min="1" placeholder="Qté" />
              </div>
              <button type="button" onClick={addItem} className="btn btn-outline">+ Ajouter</button>
            </div>
          </div>
          {/* Items list */}
          {items.length > 0 && (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, padding: '11px 14px', borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>×{item.quantity}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gold-400)', fontFamily: 'var(--font-display)', fontStyle: 'italic', minWidth: 100, textAlign: 'right' }}>
                    {fmt(item.quantity * item.unitPrice)}
                  </div>
                  <button onClick={() => removeItem(i)} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(224,72,72,0.12)', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              {/* Subtotal preview */}
              {items.length > 0 && (
                <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'flex-end', gap: 16, borderTop: '1px solid var(--color-border)' }}>
                  {(() => {
                    const sub = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
                    const tax = sub * (parseFloat(form.tax) / 100)
                    return (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>HT: {fmt(sub)} · TVA {form.tax}%: {fmt(tax)}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, fontWeight: 800, color: 'var(--color-gold-400)' }}>TTC: {fmt(sub + tax)}</div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={() => setModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Annuler</button>
            <button onClick={handleCreate} className="btn btn-gold" style={{ flex: 1 }}>Générer la Facture</button>
          </div>
        </div>
      </Modal>

      {/* Print Preview Modal */}
      <Modal isOpen={!!printModal} onClose={() => setPrintModal(null)} title="Aperçu de la facture" size="lg">
        {printModal && (
          <div>
            {/* Clean white print preview */}
            <div ref={printRef} style={{ background: '#fff', color: '#111', padding: '48px', borderRadius: 12, fontFamily: 'Helvetica Neue, sans-serif', marginBottom: 20 }}>
              <div className="header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 48 }}>
                <div>
                  <div className="brand" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: '#111', marginBottom: 6 }}>
                    {settings.business_name || 'Aksil Miel'}
                  </div>
                  {settings.business_address && <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{settings.business_address}</div>}
                  {settings.business_phone && <div style={{ fontSize: 13, color: '#666' }}>{settings.business_phone}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 36, fontWeight: 200, letterSpacing: '0.06em', color: '#C88818', textTransform: 'uppercase', marginBottom: 10 }}>Facture</div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                    <strong>{printModal.number}</strong><br />
                    {new Date(printModal.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {printModal.dueDate && <><br />Échéance: {new Date(printModal.dueDate).toLocaleDateString('fr-FR')}</>}
                  </div>
                </div>
              </div>
              <div style={{ background: '#f8f7f4', padding: '20px 24px', borderRadius: 8, marginBottom: 36 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>Facturé à</div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{printModal.customer.name}</div>
                {printModal.customer.address && <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{printModal.customer.address}</div>}
                {printModal.customer.phone && <div style={{ fontSize: 13, color: '#666' }}>{printModal.customer.phone}</div>}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                <thead>
                  <tr>
                    {['Désignation', 'Qté', 'Prix U.', 'Total HT'].map((h, i) => (
                      <th key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#999', padding: '10px 0', borderBottom: '2px solid #eee', textAlign: i > 0 ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {printModal.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '14px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14 }}>{item.product.name}</td>
                      <td style={{ padding: '14px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14, textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '14px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14, textAlign: 'right' }}>{item.unitPrice} DA</td>
                      <td style={{ padding: '14px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{item.total} DA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginLeft: 'auto', width: 280 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#666' }}>
                  <span>Sous-total HT</span><span>{itemsSubtotal(printModal)} DA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#666' }}>
                  <span>TVA ({printModal.tax}%)</span><span>{(itemsSubtotal(printModal) * printModal.tax / 100).toFixed(2)} DA</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800, borderTop: '2px solid #111', paddingTop: 12, marginTop: 6 }}>
                  <span>Total TTC</span><span style={{ color: '#C88818' }}>{printModal.total} DA</span>
                </div>
              </div>
              {printModal.notes && <div style={{ marginTop: 40, padding: '16px 20px', background: '#f8f7f4', borderRadius: 8, fontSize: 13, color: '#666' }}><strong>Notes:</strong> {printModal.notes}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setPrintModal(null)} className="btn btn-outline">Fermer</button>
              <button onClick={handlePrint} className="btn btn-gold"><Printer size={15} /> Imprimer</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}