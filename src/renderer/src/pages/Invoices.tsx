import { useEffect, useState, useRef } from 'react'
import { Printer, Check, Plus } from 'lucide-react'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

interface Invoice {
  id: number
  number: string
  customerId: number
  total: number
  tax: number
  status: string
  dueDate: string | null
  createdAt: string
  notes: string | null
  customer: { name: string; address: string | null; phone: string | null }
  items: Array<{ product: { name: string }; quantity: number; unitPrice: number; total: number }>
}
interface Customer {
  id: number
  name: string
}
interface Product {
  id: number
  name: string
  currentStock: number
  unit: string
  sellPrice: number
  wholesale: number | null
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [printModal, setPrintModal] = useState<Invoice | null>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const { showToast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({ customerId: '', tax: '19', notes: '', dueDate: '' })
  const [items, setItems] = useState<
    Array<{ productId: number; quantity: number; unitPrice: number; name: string }>
  >([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [qty, setQty] = useState('1')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [invRes, custRes, prodRes, setRes] = await Promise.all([
      window.api.getInvoices(),
      window.api.getCustomers(),
      window.api.getProducts(),
      window.api.getSettings()
    ])
    if (invRes.success) setInvoices(invRes.data as Invoice[])
    if (custRes.success) setCustomers(custRes.data as Customer[])
    if (prodRes.success) setProducts(prodRes.data as Product[])
    if (setRes.success) setSettings(setRes.data as Record<string, string>)
  }

  const addItem = () => {
    const p = products.find((x) => x.id === parseInt(selectedProduct))
    if (!p || parseFloat(qty) <= 0) return
    setItems([
      ...items,
      { productId: p.id, quantity: parseFloat(qty), unitPrice: p.sellPrice, name: p.name }
    ])
    setSelectedProduct('')
    setQty('1')
  }

  const handleCreate = async () => {
    if (!form.customerId || items.length === 0)
      return showToast('Informations incomplètes', 'warning')
    const res = await window.api.createInvoice({
      customerId: parseInt(form.customerId),
      tax: parseFloat(form.tax),
      notes: form.notes || undefined,
      dueDate: form.dueDate || undefined,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      }))
    })
    if (res.success) {
      showToast('Facture créée', 'success')
      setModalOpen(false)
      loadData()
    } else {
      showToast(res.error || 'Erreur', 'error')
    }
  }

  const updateStatus = async (id: number, status: string) => {
    const res = await window.api.updateInvoiceStatus(id, status)
    if (res.success) loadData()
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return
    const WinPrint = window.open('', '', 'width=900,height=650')
    if (WinPrint) {
      WinPrint.document.write(`
        <html>
          <head>
            <title>Facture</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #111; }
              .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
              .logo-placeholder { width: 60px; height: 60px; background: #D1AA56; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; margin-bottom: 10px; }
              .gold-text { color: #D1AA56; }
              table { width: 100%; border-collapse: collapse; margin: 30px 0; }
              th, td { border-bottom: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f9f9f9; font-weight: 600; }
              .totals { margin-top: 30px; width: 300px; margin-left: auto; }
              .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
              .totals-row.bold { font-weight: bold; border-top: 2px solid #111; padding-top: 12px; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `)
      WinPrint.document.close()
      WinPrint.focus()
      setTimeout(() => {
        WinPrint.print()
        WinPrint.close()
      }, 250)
    }
  }

  const formatPrice = (n: number) => new Intl.NumberFormat('fr-DZ').format(n) + ' DA'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-text">Factures</h1>
          <p className="text-[14px] font-medium text-text-secondary tracking-wide mt-1">Gestion de la facturation</p>
        </div>
        <button
          onClick={() => {
            setForm({ customerId: '', tax: settings.tax_rate || '19', notes: '', dueDate: '' })
            setItems([])
            setModalOpen(true)
          }}
          className="btn btn-gold"
        >
          <Plus size={16} /> Créer une Facture
        </button>
      </div>

      <div className="card overflow-hidden shadow-sm p-0">
        <div className="table-container border-none bg-transparent rounded-none">
          <table>
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Date</th>
                <th>Échéance</th>
                <th className="text-right">Montant</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="text-text-muted text-[13px] font-medium uppercase tracking-wider">{inv.number}</td>
                  <td className="font-semibold text-text">{inv.customer?.name}</td>
                  <td className="text-text-secondary text-[13px] font-medium">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td className="text-text-secondary text-[13px] font-medium">
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="font-bold text-text text-[15px] text-right">{formatPrice(inv.total)}</td>
                  <td>
                    <span
                      className={`badge ${inv.status === 'paid' ? 'badge-success' : inv.status === 'sent' ? 'badge-info' : 'badge-warning'}`}
                    >
                      {inv.status === 'paid'
                        ? 'Payée'
                        : inv.status === 'sent'
                          ? 'Envoyée'
                          : 'Brouillon'}
                    </span>
                  </td>
                  <td className="text-right space-x-2">
                    {inv.status !== 'paid' && (
                      <button
                        onClick={() => updateStatus(inv.id, 'paid')}
                        className="btn btn-ghost p-1.5 text-success"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button onClick={() => setPrintModal(inv)} className="btn btn-ghost p-1.5">
                      <Printer size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouvelle Facture"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Client *</label>
              <select
                className="input"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              >
                <option value="">Sélectionner</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">TVA (%)</label>
              <input
                type="number"
                className="input"
                value={form.tax}
                onChange={(e) => setForm({ ...form, tax: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 items-end border border-border p-3 rounded-lg bg-surface-elevated">
            <div className="flex-1">
              <label className="input-label">Produit</label>
              <select
                className="input"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Choisir</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sellPrice} DA)
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
                min="1"
              />
            </div>
            <button type="button" onClick={addItem} className="btn btn-outline border-border">
              Ajouter
            </button>
          </div>

          {items.length > 0 && (
            <div className="border border-border rounded-[14px] overflow-hidden bg-surface-elevated">
              <table>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th className="text-right">Qté</th>
                    <th className="text-right">Prix U.</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-text">{i.name}</td>
                      <td className="text-right font-medium">{i.quantity}</td>
                      <td className="text-right text-text-secondary">{formatPrice(i.unitPrice)}</td>
                      <td className="font-bold text-text text-[14px] text-right">{formatPrice(i.quantity * i.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button onClick={() => setModalOpen(false)} className="btn btn-outline flex-1">
              Annuler
            </button>
            <button onClick={handleCreate} className="btn btn-gold flex-1">
              Générer la Facture
            </button>
          </div>
        </div>
      </Modal>

      {/* Print Preview Modal */}
      <Modal
        isOpen={!!printModal}
        onClose={() => setPrintModal(null)}
        title="Aperçu avant impression"
        size="lg"
      >
        {printModal && (
          <div className="space-y-4">
            <div
              className="bg-white text-black p-8 rounded-lg max-h-[60vh] overflow-auto"
              ref={printRef}
            >
              <div className="header">
                <div>
                  <div className="logo-placeholder">Aksil</div>
                  <h2 style={{ margin: 0 }}>{settings.business_name || 'Aksil Miel'}</h2>
                  <p style={{ margin: '5px 0', color: '#666' }}>{settings.business_address}</p>
                  <p style={{ margin: '5px 0', color: '#666' }}>Tél: {settings.business_phone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 className="gold-text" style={{ fontSize: '32px', margin: '0 0 10px 0' }}>
                    FACTURE
                  </h1>
                  <p>
                    <strong>N°:</strong> {printModal.number}
                  </p>
                  <p>
                    <strong>Date:</strong> {new Date(printModal.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div
                style={{
                  margin: '40px 0',
                  padding: '20px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px'
                }}
              >
                <h3 style={{ margin: '0 0 10px 0' }}>Facturé à :</h3>
                <p style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>
                  {printModal.customer.name}
                </p>
                <p style={{ margin: '0' }}>{printModal.customer.address || ''}</p>
                <p style={{ margin: '5px 0 0 0' }}>{printModal.customer.phone || ''}</p>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Désignation</th>
                    <th>Quantité</th>
                    <th>Prix Unitaire</th>
                    <th>Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {printModal.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.product.name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unitPrice} DA</td>
                      <td>{item.total} DA</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="totals">
                <div className="totals-row">
                  <span>Sous-total HT:</span>
                  <span>{printModal.items.reduce((s, i) => s + i.total, 0)} DA</span>
                </div>
                <div className="totals-row">
                  <span>TVA ({printModal.tax}%):</span>
                  <span>
                    {printModal.items.reduce((s, i) => s + i.total, 0) * (printModal.tax / 100)} DA
                  </span>
                </div>
                <div className="totals-row bold gold-text">
                  <span>Total TTC:</span>
                  <span>{printModal.total} DA</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={handlePrint} className="btn btn-gold">
                <Printer size={16} /> Imprimer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
